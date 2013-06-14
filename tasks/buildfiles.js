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


@toc
1. pull in grunt options and config
2. init and form file paths
3. set grunt.config paths (for use later in other grunt tasks)
4. write the actual file(s) using the grunt template(s)

@todo - figure out how to make uglify files key be dynamic rather than hardcoded..
*/
module.exports = function(grunt) {
	grunt.registerTask("buildfiles", "Generate resource file names and build final files using grunt templates depending on server environment config", function() {
	
		/**
		Pull in grunt options and config.
		See if in production ('prod') mode or not based off command line parameters (i.e. `grunt --type=prod` )
		@toc 1.
		*/
		var conf =grunt.config('buildfiles');
		
		//see if in production mode (via grunt command line option) or not
		var gruntOptType =false;
		if(grunt.option('type')) {
			gruntOptType =grunt.option('type');
		}
		grunt.log.writeln('type: '+gruntOptType);
		
		var files =conf.buildfilesArray;

		

		/**
		Init filePaths and then build them (join directory and filenames toegether for each file)
		@toc 2.
		*/
		/**
		@property filePaths Will hold all the final files (joining the directory with the file name) by type. Each type (html, css, js) is an array of file paths.
			'all' key is for BOTH custom and external/3rd party files
			'custom' key is for custom files. These are just files that SHOULD be linted (and minified) (i.e. all files that are NOT in one of the 'dirsExt' directories). This is the OPPOSITE of the 'ext' key - whichever files are NOT in 'ext' will be in here.
			'ext' key is for external / 3rd party files. These are just files that should NOT be linted and minfied (i.e. all files that ARE in one of the 'dirsExt' directories). This is the OPPOSITE of the 'custom' key - whichever files are NOT in 'custom' will be in here.
		@type Object
		*/
		var filePaths ={
			all: {
				css: [],
				js: [],
				html: []
			},
			custom: {
				js: []
			},
			ext: {
				js: []
			}
		};
		
		//build full file resource links (join directory with file to form full path)
		for(var type in files) {	//go through all resource types (css, js)
			for(var dir in files[type].files) {		//go through all directories
			
				//see if this dir is a custom one (i.e. not an external/3rd party library directory)
				var customDir =false;
				if(files[type].dirsExt !==undefined) {
					customDir =true;
					for(var dd =0; dd<files[type].dirsExt.length; dd++) {
						if(files[type].dirsExt[dd] ==dir) {
							customDir =false;
							break;
						}
					}
				}
				
				//go through each file and join it to the directory to form the full path
				var dirPath =files[type].dirs[dir];
				for(var ii =0; ii<files[type].files[dir].length; ii++) {		//go through each file in this directory
					var curPathPart =dirPath+'/'+files[type].files[dir][ii];		//form the full path
					
					//add to the main ('all') file group
					filePaths.all[type].push(curPathPart);
					
					//if a custom directory, add to the custom file group as well
					if(customDir) {
						if(type =='js') {
							filePaths.custom[type].push(curPathPart);
						}
					}
					//if NOT a custom directory (i.e. if an external / 3rd party directory), add to the ext file group as well
					else {
						if(type =='js') {
							filePaths.ext[type].push(curPathPart);
						}
					}
				}
			}
		}

		

		/**
		update/set grunt.config paths (for use later in other grunt tasks)
		@toc 3.
		*/
		if(conf.configPaths !==undefined) {
			var config, prefix, fileType, ii, fileGroup, prefixedFilePaths;
			for(config in conf.configPaths) {		//iterate through each config path
				prefix =conf.configPaths[config].prefix || '';		//default to no prefix
				fileGroup =conf.configPaths[config].fileGroup || 'all';		//default to all (both custom and ext files)
				// console.log('config: '+config+' prefix: '+prefix+' fileGroup: '+fileGroup);
				
				for(fileType in conf.configPaths[config].files) {		//iterate through each file type
					//form new file paths array with prefix prepended
					prefixedFilePaths =[];
					for(ii =0; ii<filePaths[fileGroup][fileType].length; ii++) {
						prefixedFilePaths[ii] =prefix+filePaths[fileGroup][fileType][ii];
					}
					
					//if want to add additional files to this grunt.config, add them now
					if(conf.configPaths[config].additionalFiles !==undefined && conf.configPaths[config].additionalFiles.length >0) {
						for(ii =0; ii<conf.configPaths[config].additionalFiles.length; ii++) {
							prefixedFilePaths.push(conf.configPaths[config].additionalFiles[ii]);
						}
					}
					
					//special case for uglify task		//@todo - fix this..
					if(conf.configPaths[config].uglify !==undefined && conf.configPaths[config].uglify) {
						prefixedFilePaths ={
							'<%= customMinifyFile %>': prefixedFilePaths
						};
					}
					
					//actually set the grunt.config now that we have the final file paths (with the prefixes prepended)
					for(ii=0; ii<conf.configPaths[config].files[fileType].length; ii++) {
						// console.log(conf.configPaths[config].files[fileType][ii]+' '+prefixedFilePaths);
						grunt.config(conf.configPaths[config].files[fileType][ii], prefixedFilePaths);
					}
				}
			}
		}

		

		/**
		write the actual file(s) using the grunt template(s)
		@toc 4.
		*/
		// var msg ='';
		for(var ff in conf.files) {
			//check to see if should write this file at all using 'ifOpt' param which corresponds to command line arguments (i.e. `--if=yes`) which correspond to grunt.option here.
			var goTrig =true;
			if(conf.files[ff].ifOpt !==undefined) {
				goTrig =false;
				if(grunt.option(conf.files[ff].ifOpt.key)) {
					if(grunt.option(conf.files[ff].ifOpt.key) ==conf.files[ff].ifOpt.val) {
						goTrig =true;
					}
				}
				if(!goTrig) {
					grunt.log.writeln('buildfiles skip file due to ifOpt: src: '+conf.files[ff].src);
				}
			}
			
			if(goTrig) {
				var src =conf.files[ff].src;
				var dest =conf.files[ff].dest;
				//if in production mode and have a production file destination, use that instead
				if(gruntOptType =='prod' && conf.files[ff].destProd !=undefined) {
					dest =conf.files[ff].destProd;
				}
				
				// msg+='src: '+src+' dest: '+dest+'\n';
				var tmpl = grunt.file.read(src);
				grunt.file.write(dest, grunt.template.process(tmpl));
			}
		}
		// grunt.log.writeln('writeFiles: '+msg);
		
		

		grunt.log.writeln('buildfiles done');
	
	});
};