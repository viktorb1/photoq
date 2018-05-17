var fs = require('fs'); // use filesystem module
var sqlite3 = require('sqlite3').verbose(); // use sqlite
var url = require('url');
var http = require('http');
var sizeOf = require('image-size');

var data = fs.readFileSync('6whs.json'); // open json file

var db = new sqlite3.Database('./PhotoQ.db');

var count = 0;

if (!data) {
    console.log("cannot read json file");
} else {
    listObj = JSON.parse(data);
    var imgList = listObj.photoURLs; // json images now in imgList

    // for each image in imgList, add a row to the database with info
    for (var i = 0; i < imgList.length; i++) {
        getSize(i, imgList, insertDb);
    }
}

function getSize(i, imgList, insertDb) {
    var parsedURL = url.parse(imgList[i]);

    // we need to get the image to the server to find the width and height of img
    // so we make a http request for the image
    http.get(parsedURL, function(response) {
        var chunks = [];
        response.on('data', function(chunk) {
            chunks.push(chunk);
        }).on('end', function() { // end event is when img has totally arrived
            var buffer = Buffer.concat(chunks);
            // from buffer we can now access the width and height of the picture
            // sizeOf(buffer) returns 2 properties: width and height
            var dimensions = sizeOf(buffer);

            // new we can get the dimensions of the image
            var width = dimensions.width;
            var height = dimensions.height;

            // get the file name part of the URL
            var str = imgList[i].split('/');
            var fileName = str[str.length - 1];

            insertDb(i, fileName, dimensions.width, dimensions.height);
        });
    });
}

function insertDb(i, fileName, width, height) {
    // add row to database
    var cmdStr = "INSERT INTO photoTags VALUES(" + i + ", \'" + fileName + "\', " + width + ", " + height + ", \"\", \"\")";

    db.run(cmdStr, dbCallback);
}

// prints error messages if errors occur
function dbCallback(error) {
    if (error) {
        console.log(error);
    } else {
        count++;
    }

    console.log(count);

    // if all photos were added to db, let's close it and save them
    if (count == imgList.length) {
        // console.log('would close at count ', count);
        dumpDB();
        db.close();
    }
}

// prints out the whole database
function dumpDB() {
    db.all('SELECT * FROM photoTags', dataCallback);
    function dataCallback(err, data) {
        console.log(data);
    }
}
