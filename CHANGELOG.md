## 0.3.7
## Features
- support `grunt.template` `options.data` for writing files via new `templateData` option

## 0.3.6
## Features
- add `moduleGroupsSkipPrefix` (defaults to __) as (proper) way to 'comment out' modules or skipModules in `buildfilesModuleGroups.json` and NOT include them. Also fix error (change to console WARNING) that would result from bad module name.

## 0.3.5
## Features
- add `ifOpts` to `configPaths` so can conditionally set paths (this is useful since can no longer overwrite paths with later ones due to 0.3.4 concat feature)


## 0.3.4
## Features
- concat / join `configPaths` `outputFiles` if the SAME across different `configPaths` keys (previously it just was an overwrite)
	- add grunt-contrib-watch (and grunt-focus) for example usage

## 0.3.3
##Features
- support ANY file type (no longer just limited to html, css, less, js)


## 0.3.2
## Bug Fixes
- Actually support blank `path` values if want to put the directory as part of the file name (last fix did not actually work fully, was another case)

## 0.3.1
## Features
- Support blank `path` values if want to put the directory as part of the file name

## 0.3.0
### Breaking changes
- Complete refactor:
	- switch to modules instead of separating by HTML, JS, & CSS.
		- `buildfilesList.js` removed and REPLACED by `buildfilesModules.json` and `buildfilesModuleGroups.json`
			- much more flexible - you can now define infinite 'module groups' of files you want (thus enabling infinite 'builds' of your code) via buildfilesModuleGroups.json - just define ALL your modules in buildfilesModules.json and then select the ones you want per each build in buildfilesModuleGroups.json.
			- the Gruntfile.js `configPaths` parameter in the `buildfiles` task now takes a `moduleGroup` name for what files to use.
	- see README for more info and new usage.
	
## Features
- support LESS so you can now grunt-template build your _base.less file with @import for all the less files and use this to generate your final (minified) CSS

	
## v0.2.21
### Breaking changes
- changed `ifOpt` to `ifOpts` so can now pass in multiple options. Multiple options are checked as an `and` so ALL options must match for the condition to be true.
- removed `destProd` when writing files - just use `ifOpts` now with `src` and `dest`.

## v0.2.1
- add `ifOpt` support for conditionally writing files. This allows setting command line arguments (i.e. `--if=yes`) to dictate whether or not a file should be written. This is useful if have multiple build sources (pending configuration and use) that all go to the same `index.html` so `index.html` is just over-written multiple times but rather only the APPROPRIATE source file is used.

## v0.2.0
- NOTE: this is a refactoring that has BREAKING CHANGES and is not backwards compatible with older versions of the Gruntfile.js so you'll need to update your Gruntfile accordingly to match the new, more generic structure. The buildfilesList.js IS backwards compatible though so that can stay.
- Refactored to be more flexibile. Instead of only supporting specific tasks such as concat, lint, uglify, these are all now subsets of more generic functioning to take a set of files and build file paths from a prefix, directory, and filename. So you can now use this task for a wide array of functions other than just the ones originally in mind when it was build. It effectively is a generic alerternative to file path globbing (i.e. 'src/**/*.js' ) grunt.config paths and allows you to explicitly set each file you want to include.
- Added html files support (in addition to javascript and css). Specifically aimed at building AngularJS $templateCache javascript file from a set of html partials - but it can generally be used to combine a set of html files for any use.
- Added more documentation so should be easier to follow now

## v0.1.13
- Changed configPaths to take arrays so can set as many config paths as you'd like (no longer limited to just one)

## v0.1.12
- Added support for noPrefix file paths for additionally flexibility (i.e. for use in Testacular config file to generate script files to load)