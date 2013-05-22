var inst ={
	/*
	Example: filePaths:{
		'js':[
			...
		],
		'css':[
			...
		],
	}
	*/		
	files: {
		css: {
			dirs: {
				css:"css",
				modules: "modules"
			},
			files: {
				css: [
					"file1.css"
				],
				modules: [
					"mod1/mod1.css"
				]
			},
		},
		js: {
			dirs: {
				js:"js",
				jsExt:"js/ext",
				modules: "modules"
			},
			dirsExt:['jsExt'],		//lists all (external/3rd party) directories that are assumed to be already be "final" (linted, minimized) and thus won't be linted or minified (doing so can cause issues)
			files: {
				js:[
					"file1.js"
				],
				jsExt:[
					"extFile1.js"
				],
				modules: [
					"mod1/mod1.js"
				]
			}
		},
		html: {
			dirs: {
				templates: "templates",
				modules: "modules"
			},
			files: {
				templates: [
					"file1.html"
				],
				modules: [
					"mod1/mod1.html"
				]
			}
		}
	},

};
module.exports =inst;