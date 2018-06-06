var http = require('http');
var static = require('node-static');
var file = new static.Server('./public');
var auto = require("./makeTagTable");

var sqlite3 = require("sqlite3").verbose();  // use sqlite

var dbFileName = "PhotoQ.db";
// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFileName);

//PROFESSORS CODE
var fs = require('fs');  // file access module

// querystring used to parse the url query
var querystring = require('querystring');


function handler (request, response) {

    if (request.url.startsWith("/query"))
        handleQuery(request.url);
    else if (request.url.startsWith("/updateTag"))
        handleUpdateTag(request.url);
    else
        request.addListener('end', staticHandler).resume();

    var keywords;

    function handleQuery(url) {
        url = decodeURIComponent(url).substring(6);

        if (isValidKeyList(url)) {
            generateObject(keywords);
        } else if (isValidAutocomplete(url)) {
            generateAutocomplete(url);
        } else {
            response.writeHead(400, {"Content-Type": "text/html"});
            response.write("Bad request");
            response.end();
        }
    }

    function handleUpdateTag(url) {
        var urlQuery = decodeURIComponent(url).split("?");
        var queryObj = querystring.parse(urlQuery[1]);

        let query = "UPDATE photoTags SET tags=? WHERE idNum = ?";
        db.run(query, queryObj.tags, queryObj.idNum, function() {
            response.writeHead(204);
            response.end();
        });
    }

    function isValidKeyList(url) {

        if (!url.startsWith("?keyList="))
            return false;

        url = url.substring(9);
        keywords = url.split('+');

        if (keywords.length == 0)
            return false;

        for(let i = 0; i < keywords.length; i++)
            if (/[0-9!@#$%^&*()_-_/<>\[\]\{\\\/|\}`~]/.test(keywords[i]))
                return false;

        return true;
    }

    function isValidAutocomplete(url) {

        if (!url.startsWith("?autocomplete="))
            return false;

        url = url.substring(14);

        if (url.length == 1)
            return false;

        return true;
    }


    function generateObject(keywords) {

        let query = "SELECT * FROM photoTags WHERE "

        for (let i = 0; i < keywords.length; i++) {

            query += "(location = \"" + keywords[i].trim() + "\" OR tags LIKE \"%" + keywords[i].trim() + "%\")"

            if (i < keywords.length - 1)
                query += " AND "
        }

        db.all(query, writeObj);

        function writeObj(error, rows) {
            if (error)
                console.log("error: ", error);
            else {
                response.writeHead(200, {"Content-Type": "text/html"});

                let toSend = { message: "", rows: rows}

                if (rows.length == 0)
                    toSend.message = "There were no photos satisfying this query.";
                else
                    toSend.message = "These are all of the photos satisfying this query.";

                response.write(JSON.stringify(toSend));
                response.end();
            }
        }
    }

    function generateAutocomplete(url) {
        var keyword = url.substring(14);

        auto.makeTagTable(tagTableCallback);

        function tagTableCallback(data) {
            let subTable = Object.assign({}, data[keyword.slice(0,2).toLowerCase()]);
            console.log(subTable);

            for (let prop in subTable.tags)
                if (!prop.toLowerCase().startsWith(keyword.toLowerCase()))
                    delete subTable.tags[prop];

            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(JSON.stringify(subTable));
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
