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

There's 3 steps for you to do to use this plugin:
1. create your buildfilesModules.json and buildfilesModuleGroups.json files (and reference/`require` them in Gruntfile.js)
2. set/define your configPaths object in Gruntfile.js for what each file group is and where to stuff it (what grunt (task) property to set it to)
3. (optional) set/define your files object in Gruntfile.js for what files to write/template


## Documentation
### buildfilesModules.json
@param {String} [baseLessPath] The path to the _base.less file that all other .less files will be @import'ed into (if the file does not exist, it will be created. If it exists, it will be appended to at the bottom of the file).

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
@param {Object} buildfilesModules The JSON object from the buildfilesModules.json file

@param {Object} buildfilesModuleGroups The JSON object from the buildfilesModuleGroups.json file

@param {Object} configPaths Tells which grunt variables to stuff with the file lists based on the module group used (and optionally a prefix). Define a new key for each file group you want to write; each item is an object of:
	@param {String} moduleGroup The name of the module group that tells which files to use - MUST match a key set in buildfilesModuleGroups.json
		@example
			moduleGroup: 'all'
	
	@param {String} [prefix] Optional prefix to prepend to EACH file in this file group (i.e. 'app/src/') - this allows differentiating the same file groups for different purposes (i.e. for writing index.html vs adding files to be linted or included in tests - the relative paths may differ so this allows setting it)
		@example
			prefix: cfgJson.staticPath
		@example
			prefix: 'app/src'
	
	@param {Object} outputFiles Defines where to stuff the file array list BY FILE TYPE (one or more of 'js', 'html', 'css', 'less') for use in other grunt tasks (i.e. for lint/jshint, concat, uglify/minify, writing to index.html). Each key is an array of grunt (task) properties to write to.
		@example
			outputFiles: {
				js: ['filePathsJs'],
				css: ['filePathsCss']
			}
			
@param {Object} files Files to write/template with grunt.file.write. Define a new key for each file to write, key item is and object of:
	@param {String} src The grunt template file to use to build/write the final file
		@example
			src: publicPathRelative+"index-grunt.html"
	
	@param {String} dest The final file destination
		@example
			dest: publicPathRelative+"index.html"
			
	@param {Array} [ifOpts] Conditional rules that tell when to write this file based on command line options. File will only be written if ALL command line options are set and match the values for that key.
		@example
			ifOpts: [{key:'type', val:'prod'}]		//pass in options via command line with `--type=prod`
		@example
			ifOpts: [{key:'if', val:'yes'}, {key:'if2', val:'maybe'}]		//pass in options via command line with `--if=yes --if2=maybe`


## Buildfiles task

### Usage Examples

Example of JUST the buildfiles task config - NOTE this plugin depends on and works with other plugins and configs so this is INCOMPLETE - see the "test" directory for a full example of all necessary files and configurations.
```js
	//@todo - re-copy Gruntfile.js when done
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