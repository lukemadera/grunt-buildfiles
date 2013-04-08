/**
Takes a buildfilesArray javascript array as a config list of all javascript and css files and uses them to set the lint, concat, uglify files as well as writes grunt template files (including index.html) to include these resources appropriately.  
Can handle separating external (already minified) files from the rest to avoid any issues with double minification. To use this, set the "dirsExt" key in the buildfilesArray to an array of the directories to NOT uglify/minify

@todo - figure out how to make uglify files key be dynamic rather than hardcoded..
*/
module.exports = function(grunt) {
	grunt.registerTask("buildfiles", "Generate resource file names and build final files using grunt templates depending on server environment config", function() {
		var conf =grunt.config('buildfiles');
		var publicPath =conf.publicPath;
		var staticPath =conf.staticPath;
		
		//see if in production mode (via grunt command line option) or not
		var gruntOptType =false;
		if(grunt.option('type')) {
			gruntOptType =grunt.option('type');
		}
		grunt.log.writeln('type: '+gruntOptType);
		
		/*
		Example: filePaths:{
			'js':[
				...
			],
			'css':[
				...
			],
		}
		*/
		var files =conf.buildfilesArray;

		var filePaths ={};		//will hold all final files by type
		var filePathsConcat ={};		//will hold all final files by type for concat (different prefix)
		var filePathsMin ={
			'js':[]
		};		//will hold ONLY the external (3rd party / already minified) files and then the custom min file (built via grunt) will be added to it
		var lintFiles =[];
		
		var msgLintFiles ='';
		//build full file resource links
		for(var type in files) {	//go through all resource types (css, js)
			filePaths[type] =[];
			filePathsConcat[type] =[];
			for(var dir in files[type].files) {		//go through all directories
				//if this dir is a custom one (i.e. not an external/3rd party library directory), add it to the lint and concat list
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
				
				var dirPath =files[type].dirs[dir];
				for(var ii =0; ii<files[type].files[dir].length; ii++) {
					var curPathPart =dirPath+'/'+files[type].files[dir][ii];
					var curFile =staticPath+curPathPart;
					filePaths[type][filePaths[type].length] =curFile;
					var curFileConcat =publicPath+curPathPart;
					filePathsConcat[type][filePathsConcat[type].length] =curFileConcat;
					
					if(customDir) {
						lintFiles[lintFiles.length] =curFileConcat;
						msgLintFiles+=' '+curFileConcat+' ';
					}
					else {
						if(type =='js') {
							filePathsMin.js.push(curFileConcat);
						}
					}
				}
			}
		}

		
		//update/set grunt.config paths for other tasks to use later
		if(conf.configPaths !==undefined) {
			if(conf.configPaths.concat !==undefined) {
				//ext (already final/minified) files + custom min file
				filePathsMin.js.push(conf.customMinifyFile);
				grunt.config(conf.configPaths.concat.src.js, filePathsMin.js);
				
				grunt.config(conf.configPaths.concat.src.css, filePathsConcat.css);
				// grunt.log.writeln('concatFiles: js len ' + filePathsConcat.js.length+" "+grunt.config('concat.devJs.src').length+" "+filePathsConcat.js[0]+" "+grunt.config('concat.devJs.dest'));
				// grunt.log.writeln('concatFiles: css len ' + filePathsConcat.css.length+" "+grunt.config('concat.devCss.src').length+" "+filePathsConcat.css[0]+" "+grunt.config('concat.devCss.dest'));
			}

			//set config values so they can be used in later tasks
			if(conf.configPaths.indexFilePaths !==undefined && conf.configPaths.indexFilePaths.js !==undefined && conf.configPaths.indexFilePaths.css !==undefined) {
				grunt.config(conf.configPaths.indexFilePaths.js, filePaths.js);
				grunt.config(conf.configPaths.indexFilePaths.css, filePaths.css);
			}
			
			if(conf.configPaths.jshint !==undefined && conf.configPaths.jshint.beforeconcat !==undefined) {
				grunt.log.writeln('lintFiles: '+msgLintFiles);
				//grunt.config(conf.configPaths.jshint.beforeconcat, lintFiles);
				//lintFiles =['test/*.js'];
				grunt.config(conf.configPaths.jshint.beforeconcat, lintFiles);
			}
			
			if(conf.configPaths.uglify !==undefined && conf.configPaths.uglify.files !==undefined) {
				//@todo - figure out how to make this a dynamic config value rather than hardcoded..
				var fileTmp =conf.customMinifyFile;
				var filesTmp ={
					//fileTmp: lintFiles
					//'<%= customMinifyFile %>': lintFiles		//works
					//'<%= '+fileTmp+' %>': lintFiles
					//'public/app/temp/custom.min.js': lintFiles
				};
				//filesTemp[fileTmp] =lintFiles;
				//filesTemp['yes'] =lintFiles;
				filesTmp['<%= customMinifyFile %>'] =lintFiles;
				grunt.log.writeln('lintFiles count: '+lintFiles.length);
				// var str1 ='<%= '+fileTmp+' %>';
				// filesTmp[str1] =lintFiles;
				//grunt.config(conf.configPaths.uglify.files, {'<%= customMinifyFile %>': lintFiles});
				//grunt.config(conf.configPaths.uglify.files, {fileTmp: lintFiles});
				//grunt.config(conf.configPaths.uglify.files.fileTmp, lintFiles);
				//grunt.config(conf.configPaths.uglify.files, {'<%= "'+fileTmp+'" %>': lintFiles});
				grunt.config(conf.configPaths.uglify.files, filesTmp);
				//grunt.log.writeln('uglifyFiles: '+grunt.config('uglify.build.files'));
			}
		}

		
		//write the actual file using the template
		var msg ='';
		for(var ff in conf.files) {
			var src =conf.files[ff].src;
			var dest =conf.files[ff].dest;
			if(gruntOptType =='prod' && conf.files[ff].destProd !=undefined) {
				dest =conf.files[ff].destProd;
			}
			
			msg+='src: '+src+' dest: '+dest+'\n';
			var tmpl = grunt.file.read(src);
			grunt.file.write(dest, grunt.template.process(tmpl));
		}
		//grunt.log.writeln('writeFiles: '+msg);
		
		grunt.log.writeln('buildfiles done');
	
	});
};