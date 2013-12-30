/**
Many grunt tasks use the wildcard * or ** symbols for deciding which files to include for that task. This is simple and easy BUT doesn't allow much flexibility since if you have a particular directory or file to exclude, it becomes fairly complicated to exclude that file. Furthermore, you have to define (hardcode) this file list in your actual grunt file and you may have to define it many times (or define different variations multiple times). This plugin allows you to define your files (css, js, html) ONCE in a separate config file and gives more flexibility around which files to use where - without relying on blanket file globbing or pattern matching rules. Basically, instead of including all files by default, this plugin does the opposite - it only includes the files you explicity tell it to. This is less error prone since files won't accidentally be included that shouldn't be since each file is specified.

Secondly, this plugin writes grunt templates for you (allowing you to specify a config file in one place then use it to add these config values in all file types (your css, js and html) so you have ONE source of truth. This is especially useful for file paths, which are often shared across your css (i.e. for LESS or SASS pre-processing) and javascript (for http requests or including resources). Can also be used server side so you only need ONE config.json file for your WHOLE app (rather than one config file per language - one for css, one for javascript, one for the server, etc.)


Common use cases:
- forming and stuffing a list of file to lint/jshint and/or minify/uglify (without double linting/uglifying external library files that have already been linted/minified and should NOT be done again). For use with a grunt jshint and/or uglify task.
- forming and stuffing a list of files to concat (for use with a grunt concat task)
- dynamically generating your index.html file with all your <link rel="stylesheet" > css tags, <script> js tags and <script> template cache html files/partials (i.e. for use with AngularJS to preload all your templates for better performance)
- generate other config files (across css, js, html) using grunt template files to stick in config variables defined in a config.json file (this way you don't need to separately set, hardcode and match config variables across css, js, etc.)


More specifically, this plugin takes a buildfilesArray javascript array as a config list of all javascript and css (and html) files and uses them to set the lint, concat, uglify files as well as writes grunt template files (including index.html) to include these resources appropriately.  
Can handle separating external (already minified) files from the rest to avoid any issues with double minification. To use this, set the "dirsExt" key in the buildfilesArray to an array of the directories to NOT uglify/minify.

Grunt config params
@param {Object} buildfilesModules The JSON object from the buildfilesModules.json file

@param {Object} buildfilesModuleGroups The JSON object from the buildfilesModuleGroups.json file

@param {String} [moduleGroupsSkipPrefix ='__'] A special prefix that is used as the equivalent of "commenting out" lines / modules (since JSON doesn't allow commenting like javascript does) - this is for performance optimization only since any bad module name in `buildfilesModuleGroups.json` will be skipped anyway; this will just stop trying to find it earlier.

@param {Object} configPaths Tells which grunt variables to stuff with the file lists based on the module group used (and optionally a prefix). Define a new key for each file group you want to write; each item is an object of:
	@param {String} moduleGroup The name of the module group that tells which files to use - MUST match a key set in buildfilesModuleGroups.json
		@example
			moduleGroup: 'all'
	@param {String} [prefix] Optional prefix to prepend to EACH file in this file group (i.e. 'app/src/') - this allows differentiating the same file groups for different purposes (i.e. for writing index.html vs adding files to be linted or included in tests - the relative paths may differ so this allows setting it)
		@example
			prefix: cfgJson.staticPath
		@example
			prefix: 'app/src'
	@param {Object} outputFiles Defines where to stuff the file array list BY FILE TYPE (one or more of 'js', 'html', 'css', 'less') for use in other grunt tasks (i.e. for lint/jshint, concat, uglify/minify, writing to index.html). Each key is an array of grunt (task) properties to write to. NOTE: you CAN specify the SAME output destination across multiple configPaths / outputFiles and they'll all be joined (concatenated) together. Just make sure the prefixes match appropriately!
		@example
			outputFiles: {
				js: ['filePathsJs'],
				css: ['filePathsCss']
			}
	@param {Boolean} [uglify] Special case - set this flag to set customMinifyFile to the files		//@todo - make this dynamic rather than hardcoded..
	@param {Array} [ifOpts] Conditional rules that tell when to set config paths based on command line options. Path will be set/concatenated only if ALL command line options are set and match the values for that key.
		@example
			ifOpts: [{key:'type', val:'prod'}]		//pass in options via command line with `--type=prod`
		@example
			ifOpts: [{key:'if', val:'yes'}, {key:'if2', val:'maybe'}]		//pass in options via command line with `--if=yes --if2=maybe`
			
@param {Object} files Files to write/template with grunt.file.write. Define a new key for each file to write, key item is and object of:
	@param {String} src The grunt template file to use to build/write the final file
		@example
			src: publicPathRelative+"index-grunt.html"
	@param {String} dest The final file destination
		@example
			dest: publicPathRelative+"index.html"
	@param {Array} [ifOpts] Conditional rules that tell when to write this file based on command line options. File will only be written if ALL command line options are set and match the values for that key.
		@example
			ifOpts: [{key:'type', val:'prod'}]		//pass in options via command line with `--type=prod`
		@example
			ifOpts: [{key:'if', val:'yes'}, {key:'if2', val:'maybe'}]		//pass in options via command line with `--if=yes --if2=maybe`

@toc
1. pull in grunt config
0. init
2. formFilePaths
	2.1. parseModuleStartObj
	2.15. parseNonNestedModule
	2.2. addFiles
3. setConfigPaths
4. writeTemplateFiles
5. checkIfOpts

@todo - figure out how to make uglify files key be dynamic rather than hardcoded..
*/
module.exports = function(grunt) {
	grunt.registerTask("buildfiles", "Generate resource file names and build final files using grunt templates depending on server environment config", function() {
	
		/**
		Pull in grunt config.
		@toc 1.
		*/
		var conf =grunt.config('buildfiles');
		var modules =conf.buildfilesModules;
		var moduleGroups =conf.buildfilesModuleGroups;
		var moduleGroupsSkipPrefix =conf.moduleGroupsSkipPrefix || '__';		//this only exists for performance optimization; ANY bad module name will be skipped (obviously, since not named properly so don't know where to find it!) but this stops searching a bit earlier

		
		/**
		@property filePaths Will hold all the final files (joining the directory with the file name) by type. Each type (including but NOT limited to: html, css, less, js) is an array of file paths.
		@type Object Each key is a module group name and each module group has a key per file type (i.e. html, css, less, js) and each of those is an array of (full) file paths. So for EACH key:
			@param {Object}
				@param {Array} js
				@param {Array} html
				@param {Array} css
				@param {Array} less
				@param {Array} [type5..]
		*/
		var filePaths ={};
		
		/**
		@toc 0.
		@method init
		*/
		function init(params) {
			formFilePaths({});
			setConfigPaths({});
			writeTemplateFiles({});
			grunt.log.writeln('buildfiles done');
		}
		

		/**
		Go through moduleGroups and init/build full filePaths (join directory and filenames together for each file)
		@toc 2.
		@method formFilePaths
		*/
		function formFilePaths(params) {
			//build full file resource links (join directory with file to form full path)
			var moduleGroup, ii, moduleStart, ret1, valid;
			var path ='';		//default
			var nameDotNotation ='';		//default
			//go through each module group object
			for(var key in moduleGroups) {
				moduleGroup =moduleGroups[key];
				if(moduleGroup.modules !==undefined) {
					//go through modules key for each module name we WANT to include
					for(ii =0; ii<moduleGroup.modules.length; ii++) {
						valid =true;
						if(moduleGroup.modules[ii] =='_all') {		//special reserved word for ALL modules
							moduleStart =modules;
						}
						else {
							//check against skip prefix and only add if NOT a match
							if(moduleGroup.modules[ii].slice(0, moduleGroupsSkipPrefix.length) ==moduleGroupsSkipPrefix) {
								valid =false;
							}
							else {
								ret1 =parseModuleStartObj(moduleGroup.modules[ii], {});
								moduleStart =ret1.moduleObj;
								path =ret1.path;
								nameDotNotation =ret1.nameDotNotation;
							}
						}
						
						if(valid) {
							//now that have module to start with and parent path (if any), go through it (and ALL sub 'dir' objects, if any) and add the files by file type
							addFiles(moduleStart, path, nameDotNotation, moduleGroup, key, {});
						}
					}
				}
				else {
					grunt.log.writeln('ERROR: all moduleGroups must have a "module" array defined; '+key+' does NOT have one');
				}
			}
			
			// grunt.file.write('temp.txt', JSON.stringify(filePaths));		//TESTING
		}
		
		/**
		Recursive function. Takes a module name (including dot notation for nested module) and finds and returns the appropriate object
		@toc 2.1
		@method parseModuleStartObj
		@param {Object} params
			@param {Object} [moduleSearch] The module object to start with (defaults to the outermost / entire modules file/object)
			@param {String} [path] The existing path to use (if coming from recursive call - need to build up / save the path of past directories as get down through the nesting)
			@param {String} [nameDotNotation] The existing module dot notation name to use (if coming from recursive call - need to build up / save the module names of past directories as get down through the nesting)
		@return {Object}
			@param {Object} moduleObj The module object to start with based on the moduleName input string
			@param {String} path The full path from the ROOT for this moduleObj
			@param {String} nameDotNotation The full dot notation to the ROOT for this moduleObj
		*/
		function parseModuleStartObj(moduleName, params) {
			var ret ={
				moduleObj: {},
				path: '',
				nameDotNotation: ''
			};
			var ii, moduleSearch, ret1, ret2;
			var path, nameDotNotation;
			if(params.moduleSearch !==undefined) {
				moduleSearch =params.moduleSearch;
			}
			else {
				moduleSearch =modules;		//default to the outermost main modules object from the JSON file
			}
			if(params.path !==undefined) {
				ret.path =params.path;
			}
			if(params.nameDotNotation !==undefined) {
				ret.nameDotNotation =params.nameDotNotation;
			}
			
			
			var indexDot =moduleName.indexOf('.');
			if(indexDot >-1) {
				//just take it one directory at a time and call this function recursively until have no '.' left
				var newModuleName =moduleName.slice((indexDot+1), moduleName.length);
				var moduleNamePart =moduleName.slice(0, indexDot);
				ret1 =parseNonNestedModule(moduleSearch, moduleNamePart, {});
				
				//error handle - check to ensure an object was found and returned (otherwise (if bad name) can't nest further)
				if(!ret1.found) {
					console.log('WARNING: moduleName: '+moduleNamePart+' not found as part of: '+moduleName);
				}
				else {		//only continue if have a (non-empty) object
					var newModuleSearch =ret1.moduleObj;
					
					//get path of current module and append it to end of existing path
					if(ret1.moduleObj.path !==undefined) {		//path is an optional key so only use if exists
						path =ret1.moduleObj.path;
					}
					else {		//if no path, use 'name' key instead
						path =ret1.moduleObj.name;
					}
					//add slash to beginning IF there's already a path there (don't want a leading '/')
					if(ret.path.length >0) {
						ret.path +='/'+path;
					}
					else {
						ret.path +=path;
					}
					
					//get name of current module and append it to end of existing nameDotNotation
					nameDotNotation =ret1.moduleObj.name;
					
					//add dot to beginning IF there's already a name there (don't want a leading '.')
					if(ret.nameDotNotation.length >0) {
						ret.nameDotNotation +='.'+nameDotNotation;
					}
					else {
						ret.nameDotNotation +=nameDotNotation;
					}
					
					ret =parseModuleStartObj(newModuleName, {moduleSearch: newModuleSearch, path:ret.path, nameDotNotation:ret.nameDotNotation});		//recursive call
				}
			}
			else {		//non-nested
				ret1 =parseNonNestedModule(moduleSearch, moduleName, {});
				ret.moduleObj =ret1.moduleObj;
			}
			
			return ret;
		}
		
		/**
		@toc 2.15.
		@method parseNonNestedModule
		@param {Object} moduleSearch The module to search through
		@param {String} moduleName The name to match
		@param {Object} [params]
		@return {Object}
			@param {Object} moduleObj The module object to start with based on the moduleName input string
			// @param {String} path
			@param {Boolean} found True if moduleName was found
		*/
		function parseNonNestedModule(moduleSearch, moduleName, params) {
			var ret ={
				found: false,
				moduleObj: {},
				// path: ''		//path will always be blank for a singly nested search since the path is part of the moduleObj returned
			};
			// var path;
			for(ii =0; ii<moduleSearch.dirs.length; ii++) {
				if(moduleSearch.dirs[ii].name ==moduleName) {
					ret.moduleObj =moduleSearch.dirs[ii];
					ret.found =true;
					break;
				}
			}
			return ret;
		}
		
		/**
		Recursive function - goes through the current 'dir' module object and any sub-directories/modules as well and adds the files to the filePaths object by the appropriate type (i.e. js, html, css, less) IF it should be (i.e. it's 'active', isn't part of a skip module)
		@toc 2.2.
		@method addFiles
		@param {Object} moduleStartObj The (sub)module to start adding files from
		@param {String} pathRoot The full path to the root of modules for this moduleStartObj
		@param {String} nameRoot The full name (in dot notation) to the root of modules for this moduleStartObj
		@param {Object} moduleGroup The module group we're adding for (used to check skip modules)
		@param {String} moduleGroupName The module group name (used to add to the appropriate key in filePaths variable)
		@param {Object} [params]
		*/
		function addFiles(moduleStartObj, pathRoot, nameRoot, moduleGroup, moduleGroupName, params) {
			var ii, ff, fullPath ='', newNameRoot ='';
			
			//form new nameRoot (have to do this BEFORE check skip modules)
			if(nameRoot.length >0) {
				newNameRoot =nameRoot +'.';
			}
			if(moduleStartObj.name !==undefined) {		//on the first / outer-most one this may not exist; it should for all the rest
				newNameRoot =newNameRoot +moduleStartObj.name;
			}
			else {
				newNameRoot =nameRoot;		//reset (get rid of trailing dot)
			}
					
			valid =true;
			//check 'active' key (if it exists) to see if this module is even active (if active is 0, skip it)
			if(valid && moduleStartObj.active !==undefined && !moduleStartObj.active) {
				valid =false;
			}
			//go through skipModules key for each module name we want NOT include and only add the module if it's NOT in skipModules
			if(valid && moduleGroup.skipModules !==undefined) {
				for(ii =0; ii<moduleGroup.skipModules.length; ii++) {
					if(moduleGroup.skipModules[ii] ==newNameRoot) {		//if this is a skip module, skip it
						valid =false;
						break;
					}
				}
			}
			if(valid) {
				//create / seed filePaths for this module group name if it doesn't already exist
				if(filePaths[moduleGroupName] ===undefined) {
					filePaths[moduleGroupName] ={
						//support ANY file type now - keys will be created dynamically as needed
						// js: [],
						// html: [],
						// css: [],
						// less: []
					};
				}
				
				//append 'path' (or 'name' if 'path' doesn't exist)
				if(pathRoot.length >0) {
					fullPath =pathRoot +'/';
				}
				if(moduleStartObj.path !==undefined) {
					fullPath =fullPath +moduleStartObj.path;
				}
				else if(moduleStartObj.name !==undefined) {		//on the first / outer-most one this may not exist; it should for all the rest
					fullPath =fullPath +moduleStartObj.name;
				}
				else {
					fullPath =pathRoot;		//reset (get rid of trailing slash)
				}
				//in case of blank paths, remove the trailing slash
				if(fullPath[(fullPath.length-1)] ==='/') {
					fullPath =fullPath.slice(0, (fullPath.length-1));
				}
				
				//add 'files' by file type
				if(moduleStartObj.files !==undefined) {
					for(ff in moduleStartObj.files) {
						for(ii =0; ii<moduleStartObj.files[ff].length; ii++) {
							if(filePaths[moduleGroupName][ff] ===undefined) {
								filePaths[moduleGroupName][ff] =[];
							}
							filePaths[moduleGroupName][ff].push(fullPath+'/'+moduleStartObj.files[ff][ii]);		//need slash before file
						}
						// filePaths[moduleGroupName][ff] =filePaths[moduleGroupName][ff].concat(moduleStartObj.files[ff]);		//need to add fullPath prefix to each
					}
				}
				
				//if a 'dirs' key, do it all again for all dir nested objects
				if(moduleStartObj.dirs !==undefined) {
					for(ii =0; ii<moduleStartObj.dirs.length; ii++) {
						addFiles(moduleStartObj.dirs[ii], fullPath, newNameRoot, moduleGroup, moduleGroupName, params);		//recursive call
					}
				}
				
			}
		}
		
		/**
		Recursive function to find all sub modules of a given module
		@toc 2.3.
		@method findAllSubModuleNames
		@param {Object} [params]
			@param {Object} [moduleStartObj] The module to start searching from (defaults to all modules if omitted)
			@param {String} [moduleName] The name of the current module (parent) name - will be preprended to the new module names formed here since want to return module names in dot notation (i.e. ['build', 'build.temp'] rather than just ['build', 'temp']) since we want to match to what would actually be written in the moduleGroups JSON file. NOTE: if set, this should contain ALL dot notation prefixes to the ROOT of the main modules object since it will be used as a prefix for future module names!
				@example 'build'
				@example 'build.temp'
			@param {Array} [allModuleNames] Existing array of module names to add to (for recursion)
		@return {Array} All dot-notation (from the root) module names, i.e. ['build', 'build.temp']
		*/
		/*
		function findAllSubModuleNames(params) {
			var moduleStartObj;
			if(params.moduleStartObj !==undefined) {
				moduleStartObj =params.moduleStartObj;
			}
			else {
				moduleStartObj =modules;		//default to all
			}
			
			var allModuleNames;
			if(params.allModuleNames !==undefined) {
				allModuleNames =params.allModuleNames;
			}
			else {
				allModuleNames =[];
			}
			
			var moduleNamePrefix, curModuleName =false;
			if(params.moduleName !==undefined && params.moduleName) {
				curModuleName =params.moduleName;
				moduleNamePrefix =params.moduleName+'.';		//add dot for dot notation for appends later
			}
			else {
				moduleNamePrefix ='';
			}
			
			var ii, newModuleNames, curModuleName;
			if(moduleStartObj.name !==undefined)	{		//in case on first one, which won't have a name (all the rest should/will)
				curModuleName =moduleNamePrefix+moduleStartObj.name;
				allModuleNames.push(curModuleName);
			}
			for(ii =0; ii<curModule.dirs.length; ii++) {
				newModuleNames =findAllSubModuleNames({moduleStartObj:curModule.dirs[ii], allModuleNames: allModuleNames, moduleName:curModuleName});		//recursive call
				allModuleNames =allModuleNames.concat(newModuleNames);
			}
			
			return allModuleNames;
		}
		*/

		
		
		/**
		update/set grunt.config paths (for use later in other grunt tasks)
		@toc 3.
		@method setConfigPaths
		@param {Object} [params]
		@return [none - writes to grunt variables directly]
		
		Params passed in for each configPath via conf.configPaths
		@param {Object} configPaths Tells which grunt variables to stuff with the file lists based on the module group used (and optionally a prefix). Define a new key for each file group you want to write; each item is an object of:
			@param {String} moduleGroup The name of the module group that tells which files to use - MUST match a key set in buildfilesModuleGroups.json
				@example
					moduleGroup: 'all'
			@param {String} [prefix] Optional prefix to prepend to EACH file in this file group (i.e. 'app/src/') - this allows differentiating the same file groups for different purposes (i.e. for writing index.html vs adding files to be linted or included in tests - the relative paths may differ so this allows setting it)
				@example
					prefix: cfgJson.staticPath
				@example
					prefix: 'app/src'
			@param {Object} outputFiles Defines where to stuff the file array list BY FILE TYPE (one or more of 'js', 'html', 'css', 'less', etc.) for use in other grunt tasks (i.e. for lint/jshint, concat, uglify/minify, writing to index.html). Each key is an array of grunt (task) properties to write to.
				@example
					outputFiles: {
						js: ['filePathsJs'],
						css: ['filePathsCss']
					}
			@param {Boolean} [uglify] Special case - set this flag to set customMinifyFile to the files		//@todo - make this dynamic rather than hardcoded..
		*/
		function setConfigPaths(params) {
			if(conf.configPaths !==undefined) {
				// var msg ='';		//TESTING
				//will output which files are skiped and which are written
				var writeFiles ={
					skip: [],
					// write: []
				};
			
				var config, prefix, fileType, moduleGroup, prefixedFilePaths, goTrig;
				// used to store files paths PER key - this will support concatenating files together for the SAME key (rather than just over-writing)
				var outputKeyVals ={};
				var curKey;
				for(config in conf.configPaths) {		//iterate through each config path
					goTrig =true;
					if(conf.configPaths[config].ifOpts !==undefined) {
						goTrig =checkIfOpts(conf.configPaths[config].ifOpts, {});
						if(!goTrig) {
							writeFiles.skip.push('key: '+config);
						}
					}
					
					if(goTrig) {
						prefix =conf.configPaths[config].prefix || '';		//default to no prefix
						moduleGroup =conf.configPaths[config].moduleGroup || 'all';		//default to all (both custom and ext files)
						// console.log('config: '+config+' prefix: '+prefix+' moduleGroup: '+moduleGroup);
						
						for(fileType in conf.configPaths[config].outputFiles) {		//iterate through each file type
							if(filePaths[moduleGroup] !==undefined && filePaths[moduleGroup][fileType] !==undefined) {
								//form new file paths array with prefix prepended
								prefixedFilePaths =[];
								for(ii =0; ii<filePaths[moduleGroup][fileType].length; ii++) {
									prefixedFilePaths[ii] =prefix+filePaths[moduleGroup][fileType][ii];
								}

								//special case for uglify task		//@todo - fix this..
								if(conf.configPaths[config].uglify !==undefined && conf.configPaths[config].uglify) {
									prefixedFilePaths ={
										'<%= customMinifyFile %>': prefixedFilePaths
									};
									for(ii=0; ii<conf.configPaths[config].outputFiles[fileType].length; ii++) {
										grunt.config(conf.configPaths[config].outputFiles[fileType][ii], prefixedFilePaths);
									}
								}
								else {
								
									//actually set the grunt.config now that we have the final file paths (with the prefixes prepended)
									for(ii=0; ii<conf.configPaths[config].outputFiles[fileType].length; ii++) {
										curKey =conf.configPaths[config].outputFiles[fileType][ii];
										if(outputKeyVals[curKey] !==undefined) {
											outputKeyVals[curKey] =outputKeyVals[curKey].concat(prefixedFilePaths);
										}
										else {
											outputKeyVals[curKey] =prefixedFilePaths;
										}
										/*
										//now supporting concat / joining across multiple configs if the SAME key
										// msg +=conf.configPaths[config].outputFiles[fileType][ii]+' '+prefixedFilePaths+'\n';		//TESTING
										grunt.config(conf.configPaths[config].outputFiles[fileType][ii], prefixedFilePaths);
										*/
									}
								}
							}
							else {
								grunt.log.writeln('WARNING: undefined: filePaths.'+moduleGroup+' and/or filePaths.'+moduleGroup+'.'+fileType);
							}
						}
					}
				}
				
				//actually write the files / set the grunt.config now that we have the final file paths (with the prefixes prepended)
				for(curKey in outputKeyVals) {
					grunt.config(curKey, outputKeyVals[curKey]);
				}
				
				//output message detailing which sections were skipped
				var msg ='\nbuildfiles forming configPaths:\n';
				outputWriteFiles(writeFiles, msg, {});
			}
		}

		
		
		/**
		write the actual file(s) using the grunt template(s). `ifOpts` are used with command line options to see which files (if any) to skip. ifOpts are treated as an `and` so if multiple are specified, ALL must match for the file to be written.
		@toc 4.
		@method writeTemplateFiles
		*/
		function writeTemplateFiles(params) {
			//will output which files are skiped and which are written
			var writeFiles ={
				skip: [],
				write: [],
			};
			for(var ff in conf.files) {
				//check to see if should write this file at all using 'ifOpts' param which corresponds to command line arguments (i.e. `--if=yes`) which correspond to grunt.option here.
				var goTrig =true;
				if(conf.files[ff].ifOpts !==undefined) {
					goTrig =checkIfOpts(conf.files[ff].ifOpts, {});
					if(!goTrig) {
						writeFiles.skip.push('src: '+conf.files[ff].src);
						// grunt.log.writeln('buildfiles SKIP file due to ifOpts: src: '+conf.files[ff].src);
					}
					/*
					//go through ALL ifOpts and find at least ONE that either is undefined or does not match, then set goTrig to false
					for(ii =0; ii<conf.files[ff].ifOpts.length; ii++) {
						if(grunt.option(conf.files[ff].ifOpts[ii].key) ===undefined || grunt.option(conf.files[ff].ifOpts[ii].key) != conf.files[ff].ifOpts[ii].val) {
							goTrig =false;
							writeFiles.skip.push('src: '+conf.files[ff].src);
							// grunt.log.writeln('buildfiles SKIP file due to ifOpts: src: '+conf.files[ff].src);
							break;
						}
					}
					*/
				}
				
				if(goTrig) {
					var src =conf.files[ff].src;
					var dest =conf.files[ff].dest;
					var tmpl = grunt.file.read(src);
					grunt.file.write(dest, grunt.template.process(tmpl));
					// grunt.log.writeln('buildfiles writing file: src: '+src+' dest: '+dest);
					// writeFiles.write.push('src: '+src+' dest: '+dest);
					writeFiles.write.push(dest+' src: '+src);
				}
			}
			
			//output message detailing which files were written and which were skipped
			var msg ='\nbuildfiles writing files (if multiple files go to the same destination, the LAST one is the src that will have been used):\n';
			outputWriteFiles(writeFiles, msg, {});
		}
		
		
		/**
		@toc 5.
		@method checkIfOpts
		@param {Array} ifOpts
		@param {Object} params
		@return {Boolean} True if satisfies ALL ifOpts conditions
		*/
		function checkIfOpts(ifOpts, params) {
			var ii;
			var goTrig =true;
			//go through ALL ifOpts and find at least ONE that either is undefined or does not match, then set goTrig to false
			for(ii =0; ii<ifOpts.length; ii++) {
				if(grunt.option(ifOpts[ii].key) ===undefined || grunt.option(ifOpts[ii].key) != ifOpts[ii].val) {
					goTrig =false;
					break;
				}
			}
			return goTrig;
		}
		
		
		/**
		@toc 6.
		@method outputWriteFiles
		*/
		function outputWriteFiles(writeFiles, msg, params) {
			if(msg ===undefined || !msg) {
				msg ='\n';
			}
			if(writeFiles.skip !==undefined && writeFiles.skip.length >0) {
				msg +='SKIPPED files (due to ifOpts):\n';
				for(ii =0; ii<writeFiles.skip.length; ii++) {
					msg+=(ii+1)+'. '+writeFiles.skip[ii]+'\n';
				}
			}
			if(writeFiles.write !==undefined && writeFiles.write.length >0) {
				msg +='WRITTEN files:\n';
				for(ii =0; ii<writeFiles.write.length; ii++) {
					msg+=(ii+1)+'. '+writeFiles.write[ii]+'\n';
				}
			}
			grunt.log.writeln(msg);
		}
		
		

		init({});		//start everything
	
	});
};