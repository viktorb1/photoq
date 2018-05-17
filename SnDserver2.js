var http = require('http');
var static = require('node-static');
var file = new static.Server('./public');

var sqlite3 = require("sqlite3").verbose();  // use sqlite

var dbFileName = "PhotoQ.db";
// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFileName);

//PROFESSORS CODE
var fs = require('fs');  // file access module


function handler (request, response) {

    if (request.url.startsWith("/query"))
        dynamicHandler(request.url);
    else
        request.addListener('end', staticHandler).resume();


    var nums;

    function dynamicHandler(url) {
        url = url.substring(6);

        if (inputIsValid(url)) {
            generateObject(nums);
        } else {
             response.writeHead(400, {"Content-Type": "text/html"});
             response.write("Bad request");
             response.end();
        }
    }


    function inputIsValid(url) {

        if (!url.startsWith("?numList="))
            return false;
        else
            url = url.substring(9);

        nums = url.split('+').map(Number);
        
        if (nums.length == 0)
            return false;

        for(let i = 0; i < nums.length; i++) {
            if (isNaN(nums[i]))
                return false;
            else if (nums[i] < 0)
                return false;
            else if (nums[i] > 988)
                return false;
            else if (!Number.isInteger(nums[i]))
                return false;
        }

        return true;
    }

    
    function generateObject(nums) {
        let query = "SELECT filename, width, height " +
                    "FROM photoTags " +
                    "WHERE idNum IN (" + nums.join(",") + ") ;";

        db.all(query, writeObj);

        function writeObj(error, rows) {
            if (error)
                console.log("error: ", error);
            else {
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write(JSON.stringify(rows));
                    response.end();
            }  
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