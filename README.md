# grunt-buildfiles
Build and set javascript, css, less, and html assets dynamically for other grunts tasks (i.e. jshint, concat, uglify) and to build index.html and other grunt template files.

This plugin basically does 2 things:

1. replace glob file path definitions for grunt tasks with explicitly defined lists of files based on ONE config file. So if you want to exclude one or more files from a grunt task, rather than having to list out all the ones you want to include in the Gruntfile, you can list them once (by directory) in buildfilesModules.json and then use them in as many grunt tasks as you like. This keeps your Gruntfile DRY (Don't Repeat Yourself) and keeps ONE source of truth for all your assets for easier maintenance. Basically buildfilesModules.json controls your assets for your entire app/frontend.

2. use grunt templates to generate files based off one config file. Combined with the above, this allows you to leverage ONE config file to build all your resources across all languages (CSS, JS, HTML) without having to hardcode anything outside of this one config file. Basically dynamic path names for referencing all assets, anywhere in your app.

Basically this allows you to define all your resources/dependencies (css, less, html templates, javascript files) ONCE in a JSON file and then use that single file to lint, concat, and minify these assets AND use the grunt template writer to dynamically build files such as an index.html file that generates the appropriate `<link..>` and `<script..>` tags for these assets.

For more information, see the comments and documentation in the `tasks/buildfiles.js` grunt task file as well as the `Gruntfile.js` and `test/config/buildfilesModules.json` and `test/config/buildfilesModuleGroups.json` files.

NOTE: the biggest current weakness is that the uglify task only seems to work with a '<%= fileNameHere %>' key that refers to a path defined on grunt.initConfig(..) so it must be hardcoded into the buildfiles task and is currently "customMinifyFile" so you MUST define this and set it to a (temporary) filename that uglify will minimize the file to. Again, any enlightenment as to how to get around this is welcome - it's likely a (simple) syntax fix that eludes me..


## Why / Usage Examples
- separating out mobile vs desktop code (especially when code is modular and in one repo)
While you could have completely separate repos for desktop vs mobile code, especially with responsive design and HTML5 apps, there's often a lot of common code so having to duplicate and keep that in sync across multiple repositories can be error prone and a hassle. With this plugin you can pull ALL your code in ONE repo and easily pick out the files you want for a particular build (note this is NOT limited to just mobile vs desktop - you can set infinite file/module groups in buildfilesModuleGroups.json). This makes it easy and automated (i.e. great for use with Continuous Integration) to generate multiple different builds from the SAME code base. It's easy to add or remove modules from one or more builds.

- separating out minified (3rd party) vs non-minified code
You generally want to lint/jshint, concat, and minify all your javascript into ONE final file and while typically 3rd party files come minified, some don't so then you have to minify those too during the build process. File globbing to target the appropriate files to minify/not minify can get messy. This plugin allows explicitly stating and grouping any sets of files.


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-buildfiles --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-buildfiles');
```

There's 3 steps for you to do to use this plugin:
1. create your buildfilesModules.json and buildfilesModuleGroups.json files (and reference/`require` them in Gruntfile.js)
2. set/define your configPaths object in Gruntfile.js for what each file group is and where to stuff it (what grunt (task) property to set it to)
3. (optional) set/define your files object in Gruntfile.js for what files to write/template


## Documentation

### buildfilesModules.json

@param {Array} dirs The directories to include. These can be infinitely nested. Each `dirs` is an object with the following keys:

	@param {String} name The name / identifier for this object/item/directory
	
	@param {String} [path] File path for where this directory is. Defaults to the `name` key if omitted
	
	@param {Array} [dirs] Allows further nesting for sub-directories / files (without having to type out the full paths each time - `path` is chained down through the `dirs`. NOTE: one of `dirs` or `files` must exist.
	
	@param {Object} [files] The actual files to add in by file type, available file types below. NOTE: one of `dirs` or `files` must exist.
	
		@param {Array} [js] All the javascript files
		
		@param {Array} [html] All the html / template files
		
		@param {Array} [less] All the LESS (CSS-preprocessor) files. All less files will be @import'ed into _base.less and then the less can be compiled to final CSS.
		
		@param {Array} [css] All the CSS files
	
	@param {Number} [active =1] 0 to NOT include this object/directory - all sub-directories will be ignored as well. This is similar to commenting out a module / block of code in javascript, but JSON doesn't allow comments.
	
	@param {String} [comment] Placeholder for any comments (since JSON doesn't allow comments) - will be ignored.

### buildfilesModuleGroups.json

@param {Object} key Each key is a moduleGroup name, and each of those is:

	@param {Array} modules An array of all modules (from buildfilesModules.json) to include OR `_all` which is a special keyword for ALL modules.
	
	@param {Array} [skipModules] An array of modules to NOT include (these will be REMOVED the `modules` array list above)
	
	@param {String} [comment] Placeholder for any comments (since JSON doesn't allow comments) - will be ignored.
	
	
### buildfiles Gruntfile.js properties
See [tasks/buildfiles.js](tasks/buildfiles.js) for grunt.config properties to pass in


			
## Buildfiles task

### Usage Examples

Example of JUST the buildfiles task config - NOTE this plugin depends on and works with other plugins and configs so this is INCOMPLETE - see the "test" directory for a full example of all necessary files and configurations.
```js
		buildfiles: {
			// customMinifyFile: config.customMinifyFile,
			buildfilesModules: buildfilesModules,		//define where your list of files/directories are for all your build assets
			buildfilesModuleGroups: buildfilesModuleGroups,
			
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
				}
			}
		},
```


## Development (see https://npmjs.org/doc/developers.html for notes on publishing npm modules in general)
- run `grunt` to ensure no issues
- bump version number in package.json
- update CHANGELOG (and potentially this README) file
- git commit changes
- npm publish
- push to github (to update there as well)



## TODO
- figure out how to make uglify files key be dynamic rather than hardcoded.. (currently "customMinifyFile" must be properly defined in grunt.initConfig(..) for this plugin to work..)
- auto JSON lint and more gracefully error handle bad .json files for buildfilesModules.json and buildfilesModuleGroups.json?