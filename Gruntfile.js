/**
@todo
- cssmin (can only min files that aren't already minified - i.e. do same process as with javascript - min custom ones first THEN concat?)

NOTE: use "grunt --type=prod" to run production version

Lint, concat, & minify (uglify) process (since ONLY want to lint & minify files that haven't already been minified BUT want concat ALL files (including already minified ones) into ONE final file)
1. lint all non-minified (i.e. custom built as opposed to 3rd party) files
2. minify these custom built files (this also concats them into one)
3. concat all the (now minified) files - the custom built one AND all existing (3rd party) minified ones
*/

module.exports = function(grunt) {

	var cfgJson = require('./config.json');
	var buildfilesListObj = require('./test/config/buildfilesList');
	var publicPathRelativeRoot ="test/";		//hardcoded
	var publicPathRelative =publicPathRelativeRoot+"";		//hardcoded
	var publicPathRelativeDot ="./"+publicPathRelative;
	
	var paths = {		//publicPathRelative will be prepended
		'concatJs':"assets/main.js",
		'concatCss':"assets/main.css",
		'minJs':"assets/main-min.js",
		'minCss':"assets/main-min.css"
	};
	
	var config ={
		customMinifyFile: publicPathRelative+'temp/custom.min.js',
		customFile: publicPathRelative+'temp/custom.js'
	};
	
  // Project configuration.
  grunt.initConfig({
		customMinifyFile: config.customMinifyFile,
		customFile: config.customFile,
		pkg: grunt.file.readJSON('package.json'),
		
		lintFilesJs: [],		//will be filled/created in buildfiles task
		
		cfgJson: grunt.file.readJSON('config.json'),
		
		//will be filled/created in buildfiles task
		filePathsJs: '',
		filePathsCss: '',
		filePathsJsNoPrefix:        '',		//will be filled/created in buildfiles task
		filePathsCssNoPrefix:        '',		//will be filled/created in buildfiles task
		filePathConcatJs: cfgJson.serverPath+paths.concatJs,
		filePathConcatCss: cfgJson.serverPath+paths.concatCss,
		filePathMinJs: cfgJson.serverPath+paths.minJs,
		filePathMinCss: cfgJson.serverPath+paths.minCss,
		serverPath: cfgJson.serverPath,
		staticPath: cfgJson.staticPath,
		publicPath: cfgJson.publicPath,
		publicPathRelativeRoot: publicPathRelativeRoot,
		publicPathRelative: publicPathRelative,
		publicPathRelativeDot: publicPathRelativeDot,
		buildfiles: {
			staticPath: cfgJson.staticPath,
			publicPath: publicPathRelativeDot,
			customMinifyFile: config.customMinifyFile,
			buildfilesArray: buildfilesListObj.files,
			configPaths: {
				noPrefix: {
					js: ['filePathsJsNoPrefix'],
					css: ['filePathsCssNoPrefix']
				},
				indexFilePaths:{
					js: ['filePathsJs'],
					css: ['filePathsCss']
				},
				concat:{
					src:{
						js: ['concat.devJs.src'],
						css: ['concat.devCss.src']
					}
				},
				jshint:{
					files: ['jshint.beforeconcat']
				},
				uglify:{
					files: ['uglify.build.files']
				}
			},
			files: {
				indexHtml: {
					src: publicPathRelative+"index-grunt.html",
					dest: publicPathRelative+"index.html",
					destProd: publicPathRelative+"index-dev.html"
				},
				indexHtmlProd: {
					src: publicPathRelative+"index-prod-grunt.html",
					dest: publicPathRelative+"index-prod.html",
					destProd: publicPathRelative+"index.html"
				}
			}
		},
		concat: {
			devCss: {
				src: [],		//will be filled via buildfiles task
				dest: publicPathRelativeDot+paths.concatCss
			},
			//min version
			devJs: {
				src: [],		//will be filled via buildfiles task
				dest: publicPathRelativeDot+paths.minJs
			}
		},
		jshint: {
			options:{
				force: true
				//globalstrict: true
				//sub:true,
			},
			beforeconcat: []		//filled via buildfiles task
		},
    uglify: {
      options: {
        //banner: '/*! <%= cfgJson.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
				mangle: false
      },
      build: {
				files: {}		//filled via buildfiles task
      }
    }
  });

  // Load plugins
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	
	//grunt.loadNpmTasks('grunt-buildfiles');
	grunt.loadTasks('tasks');

  // Default task(s).
	grunt.registerTask('default', ['buildfiles', 'jshint:beforeconcat', 'uglify:build', 'concat:devJs', 'concat:devCss']);
};