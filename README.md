# grunt-buildfiles
Build and set javascript and css assets dynamically for other grunts tasks (i.e. jshint, concat, uglify) and to build index.html and other grunt template files

Basically this allows you to define all your resources/dependencies (css, javascript files) ONCE in a javascript file and then use that single file to lint, concat, and minify these assets AND use the grunt template writer to dynamically build files such as an index.html file that generates the appropriate <link..> and <script..> tags for these assets.

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
		buildfilesArray: buildfilesListObj.files,
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
	}
```

## Development (see https://npmjs.org/doc/developers.html for notes on publishing npm modules in general)
- run grunt to ensure no issues
- bump version number in package.json
- update CHANGELOG file
- git commit changes
- npm publish


## TODO
- figure out how to make uglify files key be dynamic rather than hardcoded.. (currently "customMinifyFile" must be properly defined in grunt.initConfig(..) for this plugin to work..)