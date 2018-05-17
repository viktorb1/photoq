var http = require('http');
var static = require('node-static');
var url = require('url');
var file = new static.Server('./public');

//PROFESSORS CODE
var fs = require('fs');  // file access module
var imgList = [];

loadImageList();

function loadImageList () {
    var data = fs.readFileSync('photoList.json');

    if (! data) {
        console.log("cannot read photoList.json");
    } else {
        listObj = JSON.parse(data);
        imgList = listObj.photoURLs;
    }
}


function handler (request, response) {
	var query = url.parse(request.url, true).query;

	if (request.url.startsWith("/query"))
		dynamicHandler();
	else
		request.addListener('end', staticHandler).resume();


	function dynamicHandler() {

		var num = Number(query.num);

		if(query.num != "" && Number.isInteger(num) && num >= 0 && num <= 988) {
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(imgList[num]);
			response.end();
		} else {
			response.writeHead(400, {"Content-Type": "text/html"});
			response.write("Bad request");
			response.end();
		}
	}


	function staticHandler() {
		file.serve(request, response, load404Page);
	}


	function load404Page(err, result) {
		if(err && err.status === 404)
			file.serveFile('/not-found.html', 400, {}, request, response);
	}
}

var server = http.createServer(handler);

server.listen(56272);
