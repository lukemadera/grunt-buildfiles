# grunt-buildfiles
Build and set javascript and css assets dynamically for other grunts tasks (jshint, concat, uglify) and to build index.html and other grunt template files

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

```js
// Project configuration.
var buildfilesListObj = require('./config/buildfilesList');
var publicPathRelativeRoot ="public/";		//hardcoded
var publicPathRelative =publicPathRelativeRoot+"app/";		//hardcoded
var publicPathRelativeDot ="./"+publicPathRelative;
var config ={
	customMinifyFile: publicPathRelative+'temp/custom.min.js'
};
grunt.initConfig({
	cfgJson: grunt.file.readJSON('config.json'),
	customMinifyFile: config.customMinifyFile,
	filePathsJs: '',		//will be filled/created in buildfiles task
	filePathsCss: '',		//will be filled/created in buildfiles task
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
});
```

## TODO
- figure out how to make uglify files key be dynamic rather than hardcoded..