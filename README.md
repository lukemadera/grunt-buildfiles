# grunt-buildfiles
Build and set javascript, css, and html assets dynamically for other grunts tasks (i.e. jshint, concat, uglify) and to build index.html and other grunt template files.

This plugin basically does 2 things:
1. replace glob file path definitions for grunt tasks with explicitly defined lists of files based on ONE config file. So if you want to exclude one or more files from a grunt task, rather than having to list out all the ones you want to include in the Gruntfile, you can list them once (by directory) in buildfilesList.js and then use them in as many grunt tasks as you like. This keeps your Gruntfile DRY (Don't Repeat Yourself) and keeps ONE source of truth for all your assets for easier maintenance. Basically buildfilesList.js controls your assets for your entire app/frontend.
2. use grunt templates to generate files based off one config file. Combined with the above, this allows you to leverage ONE config file to build all your resources across all languages (CSS, JS, HTML) without having to hardcode anything outside of this one config file. Basically dynamic path names for referencing all assets, anywhere in your app.

Basically this allows you to define all your resources/dependencies (css, javascript files) ONCE in a javascript file and then use that single file to lint, concat, and minify these assets AND use the grunt template writer to dynamically build files such as an index.html file that generates the appropriate `<link..>` and `<script..>` tags for these assets.

For more information, see the comments and documentation in the `tasks/buildfiles.js` grunt task file as well as the `Gruntfile.js` and `test/config/buildfilesList.js` files.

NOTE: the biggest current weakness is that the uglify task only seems to work with a '<%= fileNameHere %>' key that refers to a path defined on grunt.initConfig(..) so it must be hardcoded into the buildfiles task and is currently "customMinifyFile" so you MUST define this and set it to a (temporary) filename that uglify will minimize the file to. Again, any enlightenment as to how to get around this is welcome - it's likely a (simple) syntax fix that eludes me..

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


## Buildfiles task

### Usage Examples

Example of JUST the buildfiles task config - NOTE this plugin depends on and works with other plugins and configs so this is INCOMPLETE - see the "test" directory for a full example of all necessary files and configurations.
```js
	buildfiles: {
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
			},
			//generate production version of index.html (with just the minified and concatenated versions of css and js)
			indexHtmlProd: {
				ifOpts: [{key:'type', val:'prod'}],		//pass in options via command line with `--type=prod`
				src: publicPathRelative+"index-prod-grunt.html",
				dest: publicPathRelative+"index-prod.html"
			},
			//with multiple ifOpts to conditionally write a file
			indexHtmlIf: {
				ifOpts: [{key:'if', val:'yes'}, {key:'if2', val:'maybe'}],		//pass in options via command line with `--if=yes --if2=maybe`
				src: publicPathRelative+"index-if-grunt.html",
				dest: publicPathRelative+"index-if.html"		//can also just over-write to `index.html` here. But note that if BOTH `--type=prod` AND `--if=yes` are set, that this will OVERWRITE the index-prod-grunt writing above!
			}
		}
	}
```

## Development (see https://npmjs.org/doc/developers.html for notes on publishing npm modules in general)
- run grunt to ensure no issues
- bump version number in package.json
- update CHANGELOG (and potentially this README) file
- git commit changes
- npm publish
- push to github (to update there as well)


## TODO
- figure out how to make uglify files key be dynamic rather than hardcoded.. (currently "customMinifyFile" must be properly defined in grunt.initConfig(..) for this plugin to work..)