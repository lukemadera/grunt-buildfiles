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
				"css":"test"
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
				"test":"test",
				"testExt":"test/js/ext"
			},
			"dirsExt":['testExt'],		//lists all (external/3rd party) directories that are assumed to be already be "final" (linted, minimized) and thus won't be linted or minified (doing so can cause issues)
			"files":
			{
				"test":[
					"buildFilesList.js",
					"file1.js",
				],
				"testExt":[
					"extFile1.js"
				]
			}
		}
	},

};
module.exports =inst;