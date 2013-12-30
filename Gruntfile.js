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
	var buildfilesModules = require('./test/config/buildfilesModules.json');		//the file with the object/arrays of all modules (directories and files to form paths for (css, js, html))
	var buildfilesModuleGroups = require('./test/config/buildfilesModuleGroups.json');
	
	var publicPathRelativeRoot ="test/";		//hardcoded
	var publicPathRelative =publicPathRelativeRoot+"";		//hardcoded
	var publicPathRelativeDot ="./"+publicPathRelative;
	
	//publicPathRelative will be prepended
	var buildDir ="build";
	var paths = {
		'concatJs':buildDir+"/main.js",
		'concatCss':buildDir+"/main.css",
		'minJs':buildDir+"/main-min.js",
		'minCss':buildDir+"/main-min.css",
		'templatesJs':buildDir+"/templates.js"
	};
	var buildPath =publicPathRelative+buildDir;
	
	var config ={
		customMinifyFile: publicPathRelative+'build/temp/custom.min.js',
		customFile: publicPathRelative+'build/temp/custom.js'
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
		filePathsLess: '',
		filePathsJsNoPrefix:        '',		//will be filled/created in buildfiles task
		filePathsCssNoPrefix:        '',		//will be filled/created in buildfiles task
		filePathsJsTestNoPrefix: '',
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
		buildPath: buildPath,
		dummyVar: '',
		// testSkipPrefix: {
			// html: '',
			// js: '',
			// css: ''
		// },
		testSkipPrefix: '',
		
		buildfiles: {
			// customMinifyFile: config.customMinifyFile,
			buildfilesModules: buildfilesModules,		//define where your list of files/directories are for all your build assets
			buildfilesModuleGroups: buildfilesModuleGroups,
			// moduleGroupsSkipPrefix: '_-',
			
			//this takes your buildfiles modules and moduleGroups of all js, css, less, and html files and generates full paths to all these build assets then stuffs them into other grunt task file paths.
			configPaths: {
				// NOTE: we'll use 'watch.build.files' in MULTIPLE places here and they'll all be joined (concatenated) together
				//generic file lists for use elsewhere
				noPrefix: {
					// prefix: '',
					moduleGroup: 'allNoBuild',
					outputFiles: {
						js: ['filePathsJsNoPrefix'],
						css: ['filePathsCssNoPrefix'],
						test: ['filePathsJsTestNoPrefix']
					}
				},
				//index.html file paths (have the static path prefix for use in <link rel="stylesheet" > and <script> tags)
				indexFilePaths:{
					prefix: cfgJson.staticPath,
					moduleGroup: 'allNoBuild',
					outputFiles: {
						js: ['filePathsJs'],
						css: ['filePathsCss']
					}
				},
				//_base.less file paths (have a prefix path relative to this file for @import)
				lessFilePaths:{
					prefix: '../../',
					moduleGroup: 'allNoBuild',
					outputFiles: {
						less: ['filePathsLess']
					}
				},
				//for watch task - need a prefix
				lessFilePathsPrefix:{
					prefix: publicPathRelativeDot,
					moduleGroup: 'allNoBuild',
					outputFiles: {
						less: ['watch.build.files']
					}
				},
				//list of files to lint - will be stuffed into jshint grunt task variable(s)
				jshint:{
					prefix: publicPathRelativeDot,
					moduleGroup: 'nonMinified',
					// fileGroup: 'custom',
					outputFiles: {
						js: ['jshint.beforeconcat', 'watch.build.files']
					}
				},
				//list of js files to concatenate together - will be stuffed into concat grunt task variable(s)
				concatJsMin: {
					prefix: publicPathRelativeDot,
					moduleGroup: 'allMinified',
					// fileGroup: 'ext',
					// additionalFiles: [config.customMinifyFile],
					outputFiles: {
						js: ['concat.devJs.src']
					}
				},
				//list of css files to concat - will be stuffed into concat grunt task variable(s)
				concatCss: {
					prefix: publicPathRelativeDot,
					moduleGroup: 'allNoBuildCss',
					// fileGroup: 'all',
					outputFiles: {
						css: ['concat.devCss.src', 'cssmin.dev.src']
					}
				},
				//list of files to uglify - will be stuffed into uglify grunt task variable(s)
				uglify:{
					prefix: publicPathRelativeDot,
					moduleGroup: 'nonMinified',
					// fileGroup: 'custom',
					uglify: true,
					outputFiles: {
						js: ['uglify.build.files']
					}
				},
				//list of html templates to join together to stuff in AngularJS $templateCache - will be stuffed into ngtemplates grunt task variable(s)
				templates: {
					prefix: publicPathRelativeDot,
					moduleGroup: 'allNoBuild',
					outputFiles: {
						html: ['ngtemplates.main.src', 'watch.build.files']
					}
				},
				ifOptsTest: {
					ifOpts: [{key:'type', val:'if'}],		//pass in options via command line with `--type=if`
					prefix: publicPathRelativeDot,
					moduleGroup: 'allNoBuild',
					outputFiles: {
						html: ['dummyVar']
					}
				},
				moduleGroupSkipPrefixTest: {
					moduleGroup: 'skipPrefixTest',
					outputFiles: {
						js: ['testSkipPrefix'],
						less: ['testSkipPrefix'],
						html: ['testSkipPrefix']
					}
				}
			},
			
			//this will use `grunt.file.write` and a template file to generate a final file (dynamically inserting path names and other config parameters appropriately). NOTE: YOU must write the grunt template files that will be used to generate the files.
			files: {
				//generate development version of index.html (with dynamically generated <link rel="stylesheet" > and <script> tags for resources)
				indexHtml: {
					src: publicPathRelative+"index-grunt.html",
					dest: publicPathRelative+"index.html"
				},
				//NOTE: the below all will OVERWRITE index.html (IF itOpts are set appropriately) so these must be AFTER the above. The LAST listed one will take precedence if it's ifOpts are set and will overwrite ALL other `index.html` files that were previously written.
				//generate production version of index.html (with just the minified and concatenated versions of css and js)
				indexHtmlProd: {
					ifOpts: [{key:'type', val:'prod'}],		//pass in options via command line with `--type=prod`
					src: publicPathRelative+"index-prod-grunt.html",
					dest: publicPathRelative+"index.html"
				},
				//with multiple ifOpts to conditionally write a file - ALL must match for the file to be written
				indexHtmlIf: {
					ifOpts: [{key:'if', val:'yes'}, {key:'if2', val:'maybe'}],		//pass in options via command line with `--if=yes --if2=maybe`
					src: publicPathRelative+"index-if-grunt.html",
					dest: publicPathRelative+"index-if.html"		//can also just over-write to `index.html` here. But note that if BOTH `--type=prod` AND `--if=yes` are set, that this will OVERWRITE the index-prod-grunt writing above!
				},
				//generate _base.less file (with dynamically generated @import tags for resources)
				baseLess: {
					src: publicPathRelative+"common/less/_base-grunt.less",
					dest: publicPathRelative+"common/less/_base.less"
				},
				testSkipPrefix: {
					src: publicPathRelative+"test-skip-prefix-grunt.txt",
					dest: publicPathRelative+"test-skip-prefix.txt"
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
			beforeconcat: [],		//filled via buildfiles task
			dev: {
				options: {
					// ignores: ['node_modules']		//doesn't work - apparently doesn't handle directories..
					ignores: ['node_modules/**/*.js']
				},
				files: {
					src: ['**/*.js']
				}
			}
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
		},
		less: {
			dev: {
				options: {
				},
				files: {
					"<%= buildPath %>/temp/base.css": "<%= publicPathRelative %>common/less/_base.less"
				}
			}
		},
		cssmin: {
			dev: {
				src: [],		// will be filled via buildfiles task
				dest: publicPathRelativeDot+paths.minCss
			}
		},
		focus: {
			build: {
				include: ['build']
			}
		},
		watch: {
			build: {
				files: [],		//will be filled by grunt-buildfiles
				tasks: ['q']
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-focus');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	//grunt.loadNpmTasks('grunt-buildfiles');
	grunt.loadTasks('tasks');

	//tasks
	grunt.registerTask('q', ['buildfiles', 'ngtemplates:main', 'less:dev', 'jshint:beforeconcat']);
	
	//NOTE: must run buildfiles first since that GENERATES the watch/focus task files!
	grunt.registerTask('dev-build', ['buildfiles', 'focus:build']);
	
	grunt.registerTask('build', ['buildfiles']);
	
	grunt.registerTask('dev', ['jshint:dev']);
	
	// grunt.registerTask('default', ['buildfiles', 'ngtemplates:main', 'jshint:beforeconcat', 'uglify:build', 'less:dev', 'concat:devJs', 'concat:devCss']);
	grunt.registerTask('default', ['dev', 'buildfiles', 'ngtemplates:main', 'jshint:beforeconcat', 'uglify:build', 'less:dev', 'concat:devJs', 'cssmin:dev']);
};