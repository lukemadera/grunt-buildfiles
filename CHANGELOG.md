## v0.2.2
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