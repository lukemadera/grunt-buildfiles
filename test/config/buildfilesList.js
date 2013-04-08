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
		"css":
		{
			"dirs":
			{
				"css":"css"
			},
			"files":
			{
				"css":
				[
					"file1.css"
				]
			},
		},
		"js":
		{
			"dirs":
			{
				"js":"js",
				"jsExt":"js/ext"
			},
			"dirsExt":['jsExt'],		//lists all (external/3rd party) directories that are assumed to be already be "final" (linted, minimized) and thus won't be linted or minified (doing so can cause issues)
			"files":
			{
				"js":[
					"file1.js"
				],
				"jsExt":[
					"extFile1.js"
				]
			}
		}
	},

};
module.exports =inst;