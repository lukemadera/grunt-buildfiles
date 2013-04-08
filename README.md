# grunt-buildfiles
Build and set javascript and css assets dynamically for other grunts tasks (jshint, concat, uglify) and to build index.html and other grunt template files

Basically this allows you to define all your resources/dependencies (css, javascript files) ONCE in a javascript file and then use that single file to lint, concat, and minify these assets AND use the grunt template writer to dynamically build files such as an index.html file that generates the appropriate <link..> and <script..> tags for these assets. The downside is that because this integrates several other grunt plugins (jshint, concat, uglify) and requires you to write the grunt template files yourself, it's not very modularized. Though a full example is included for your reference and any suggestions to make it more robust, clear, and user friendly are welcome!

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
		staticPath: cfgJson.staticPath,
		publicPath: publicPathRelativeDot,
		customMinifyFile: config.customMinifyFile,
		buildfilesArray: buildfilesListObj.files,
		configPaths: {
			indexFilePaths:{
				js:'filePathsJs',
				css:'filePathsCss'
			},
			concat:{
				src:{
					js:'concat.devJs.src',
					css:'concat.devCss.src'
				}
			},
			jshint:{
				beforeconcat:'jshint.beforeconcat'
			},
			uglify:{
				files:'uglify.build.files'
			}
		},
		files: {
			indexHtml: {
				src: publicPathRelative+"index-grunt.html",
				dest: publicPathRelative+"index.html",
				destProd: publicPathRelative+"index-dev.html",
			},
			indexHtmlProd: {
				src: publicPathRelative+"index-prod-grunt.html",
				dest: publicPathRelative+"index-prod.html",
				destProd: publicPathRelative+"index.html",
			}
		}
	}
```

## TODO
- figure out how to make uglify files key be dynamic rather than hardcoded.. (currently "customMinifyFile" must be properly defined in grunt.initConfig(..) for this plugin to work..)