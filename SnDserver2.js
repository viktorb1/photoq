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


    var keywords;

    function dynamicHandler(url) {
        url = decodeURIComponent(url).substring(6);

        if (inputIsValid(url)) {
            generateObject(keywords);
        } else {
             response.writeHead(400, {"Content-Type": "text/html"});
             response.write("Bad request");
             response.end();
        }
    }


    function inputIsValid(url) {

        if (!url.startsWith("?keyList="))
            return false;
        else
            url = url.substring(9);

        keywords = url.split('+');
        
        if (keywords.length == 0)
            return false;

        for(let i = 0; i < keywords.length; i++)
            if (/[0-9!@#$%^&*()_-_/<>\[\]\{\\\/|\}`~]/.test(keywords[i]))
                return false;

        return true;
    }

    
    function generateObject(keywords) {

        let query = "SELECT * FROM photoTags WHERE "

        for (let i = 0; i < keywords.length; i++) {

            query += "(location = \"" + keywords[i] + "\" OR tags LIKE \"%" + keywords[i] + "%\")"

            if (i < keywords.length - 1)
                query += " AND "
        }

        db.all(query, writeObj);

        function writeObj(error, rows) {
            if (error)
                console.log("error: ", error);
            else {
                    response.writeHead(200, {"Content-Type": "text/html"});
                    console.log(rows);

                    let toSend = { message: "", rows: rows}

                    if (rows.length == 0)
                        toSend.message = "These were no photos satisfying this query.";
                    else
                        toSend.message = "These are all of the photos satisfying this query.";

                    response.write(JSON.stringify(toSend));
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