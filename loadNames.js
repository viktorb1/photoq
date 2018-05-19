// Globals
var sqlite3 = require("sqlite3").verbose();  // use sqlite
var fs = require("fs");
var sizeOf = require('image-size');
var url = require('url');
var http = require('http');

http.globalAgent.maxSockets = 1;

var dbFileName = "PhotoQ.db";
var numURLs;
// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFileName);
var count = 0;

function loadDatabase() {
    var file = fs.readFileSync('photoList.json', 'utf8');
    var photoURLs = JSON.parse(file).photoURLs;
    numURLs = photoURLs.length;

    for (let i = 0; i < numURLs; i++) {

        var options = url.parse(photoURLs[i]);

        http.get(options, function (response) {
            response.on('data', getChunks).on('end', getDimensions);
        });

        let chunks = [];

        function getChunks(chunk) {
                chunks.push(chunk);
        }

        function getDimensions() {
            var buffer = Buffer.concat(chunks);
            var dimensions = sizeOf(buffer);

            var height = dimensions.height;
            var width = dimensions.width;
            var fileName = photoURLs[i].split('/').pop();

            insertIntoDB(fileName, width, height, i);
        }
    }
}


function insertIntoDB(fileName, width, height, i) {
    var sql = "INSERT INTO photoTags VALUES(" + i + ", '" + fileName + "', " + width + ", " + height + ", '', '')";
    db.run(sql, doneInserting);
}


function doneInserting(error) {
    if (error)
        console.log(error);
    else
        count++;

    if (count == numURLs)
    {
        console.log("DONE!");
        db.close();
    }
}


loadDatabase();
