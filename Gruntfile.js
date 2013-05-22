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

	var cfgJson = require('./config.json');		//configuration file with paths
	var buildfilesListObj = require('./test/config/buildfilesList');		//the file with the object/arrays of all directories and files to form paths for (css, js, html)
	var publicPathRelativeRoot ="test/";		//hardcoded
	var publicPathRelative =publicPathRelativeRoot+"";		//hardcoded
	var publicPathRelativeDot ="./"+publicPathRelative;
	
	var paths = {		//publicPathRelative will be prepended
		'concatJs':"assets/main.js",
		'concatCss':"assets/main.css",
		'minJs':"assets/main-min.js",
		'minCss':"assets/main-min.css",
		'templatesJs':"assets/templates.js"
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
			// customMinifyFile: config.customMinifyFile,
			buildfilesArray: buildfilesListObj.files,		//define where your list of files/directories are for all your assets
			
			//this takes your buildfilesList of all js, css, and html files and generates full paths to all these assets then stuffs them into other grunt task file paths.
			configPaths: {
				//generic file lists for use elsewhere
				noPrefix: {
					// prefix: '',
					files: {
						js: ['filePathsJsNoPrefix'],
						css: ['filePathsCssNoPrefix']
					}
				},
				//index.html file paths (have the static path prefix for use in <link rel="stylesheet" > and <script> tags)
				indexFilePaths:{
					prefix: cfgJson.staticPath,
					files: {
						js: ['filePathsJs'],
						css: ['filePathsCss']
					}
				},
				//list of files to lint - will be stuffed into jshint grunt task variable(s)
				jshint:{
					prefix: publicPathRelativeDot,
					fileGroup: 'custom',
					files: {
						js: ['jshint.beforeconcat']
					}
				},
				//list of js files to concatenate together - will be stuffed into concat grunt task variable(s)
				concatJsMin: {
					prefix: publicPathRelativeDot,
					fileGroup: 'ext',
					additionalFiles: [config.customMinifyFile],
					files: {
						js: ['concat.devJs.src']
					}
				},
				//list of css files to concat - will be stuffed into concat grunt task variable(s)
				concatCss: {
					prefix: publicPathRelativeDot,
					fileGroup: 'all',
					files: {
						css: ['concat.devCss.src']
					}
				},
				//list of files to uglify - will be stuffed into uglify grunt task variable(s)
				uglify:{
					prefix: publicPathRelativeDot,
					fileGroup: 'custom',
					uglify: true,
					files: {
						js: ['uglify.build.files']
					}
				},
				//list of html templates to join together to stuff in AngularJS $templateCache - will be stuffed into ngtemplates grunt task variable(s)
				templates: {
					prefix: publicPathRelativeDot,
					files: {
						html: ['ngtemplates.main.src']
					}
				}
			},
			
			//this will use `grunt.file.write` and a template file to generate a final file (dynamically inserting path names and other config parameters appropriately). NOTE: YOU must write the grunt template files that will be used to generate the files.
			files: {
				//generate development version of index.html (with dynamically generated <link rel="stylesheet" > and <script> tags for resources)
				indexHtml: {
					src: publicPathRelative+"index-grunt.html",
					dest: publicPathRelative+"index.html",
					destProd: publicPathRelative+"index-dev.html"
				},
				//generate production version of index.html (with just the minified and concatenated versions of css and js)
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
		},
		ngtemplates: {
			main: {
				options: {
					module: 'myApp'
				},
				src: [],		// will be filled via buildfiles task
				dest: publicPathRelativeDot+paths.templatesJs
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-angular-templates');
	
	//grunt.loadNpmTasks('grunt-buildfiles');
	grunt.loadTasks('tasks');

	// Default task(s).
	grunt.registerTask('default', ['buildfiles', 'ngtemplates:main', 'jshint:beforeconcat', 'uglify:build', 'concat:devJs', 'concat:devCss']);
};