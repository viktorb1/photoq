// Globals
var sqlite3 = require("sqlite3").verbose();  // use sqlite
var fs = require("fs");
var sizeOf = require('image-size');
var url = require('url');
var http = require('http');

// Node module for working with a request to an API or other fellow-server
var APIrequest = require('request');

requests = [];
// An object containing the data the CCV API wants
// Will get stringified and put into the body of an HTTP request, below

imgprops = {
    location: [],
    tags: [],
    height: [],
    width: [],
    fileName: []
}

// URL containing the API key 
// You'll have to fill in the one you got from Google
apiurl = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBF-LfsGHI1RFHbHXIzgMr_rx_vnPXOZhE';

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
        requests.push({ "image": { "source": {"imageUri": photoURLs[i]} },
        "features": [{ "type": "LABEL_DETECTION", "maxResults": 6}, { "type": "LANDMARK_DETECTION"} ]});

        var options = url.parse(photoURLs[i]);

        http.get(options, 
            function (response) {
                response.on('data', getChunks).on('end', getDimensions);
            }
        );

        let chunks = [];

        function getChunks(chunk) {
            chunks.push(chunk);
        }

        function getDimensions() {
            var buffer = Buffer.concat(chunks);
            var dimensions = sizeOf(buffer);

            imgprops.height.push(dimensions.height);
            imgprops.width.push(dimensions.width)
            imgprops.fileName.push(photoURLs[i].split('/').pop());
            console.log("Getting dimensions for " + i);

            if (imgprops.height.length == numURLs) {
                console.log("Done getting image dimensions!");
                getTags();
            }
        }
    }
}


function getTags() {
    let timeToWait = 0;

    for (let i = 0; i < numURLs; i++) {

        let APIrequestObject = { "requests": []}
        APIrequestObject.requests = requests.slice(i, i+1);
        timeToWait += 2000;
        setTimeout(annotateImage, timeToWait);

        function annotateImage() {
            // The code that makes a request to the API
            // Uses the Node request module, which packs up and sends off 
            // an HTTP message containing the request to the API server
            APIrequest(
                { // HTTP header stuff
                    url: apiurl,
                    method: "POST",
                    headers: {"content-type": "application/json"},
                    // will turn the given object into JSON
                    json: APIrequestObject
                },
                // callback function for API request
                APIcallback
            );

            // callback function, called when data is received from API
            function APIcallback(err, APIresponse, body) {
                if ((err) || (APIresponse.statusCode != 200)) {
                    console.log("Got API error");
                    console.log(body);
                } else {
                    for(let i = 0; i < body.responses.length; i++) {
                        let next = body.responses[i];

                        if (next.labelAnnotations) {
                            let imgtg = [];
                            
                            for (let i = 0; i < next.labelAnnotations.length; i++)
                                imgtg.push(next.labelAnnotations[i].description);

                            console.log(imgtg.join(','));
                            imgprops.tags.push(imgtg.join(','));
                        } else {
                            console.log("This shouldn't fail");
                            imgprops.tags.push('');
                        }

                        if (next.landmarkAnnotations && next.landmarkAnnotations[0].description)
                            imgprops.location.push(next.landmarkAnnotations[0].description);
                        else
                            imgprops.location.push('');


                        if (next.error) {
                            console.log("an error occurred");
                            console.log(next.error);
                        }
                    }

                    let max =  i + body.responses.length;

                    console.log("Now inserting: " + i + " - " + (max-1));
                    insertIntoDB(i, max);
                }
            } // end callback function
        }
    }
}


function insertIntoDB(i, max) {
    for (i; i < max; i++) {
        if (!imgprops.location[i])
            imgprops.location[i] = "";

        if (!imgprops.tags[i])
            imgprops.tags[i] = "";

        console.log("LOCATION: " + imgprops.location[i]);
        console.log("TAGS: " + imgprops.tags[i]);

        let sql = "INSERT INTO photoTags VALUES(?, ?, ?, ?, ?, ?)";
        
        db.run(sql, [i, imgprops.fileName[i],  imgprops.width[i], imgprops.height[i], imgprops.location[i], imgprops.tags[i]], doneInserting);
    }
}


function doneInserting(error) {
    if (error)
        console.log(error);
    else
        count++;

    if (count == numURLs) {
        console.log("DONE!");
        db.close();
    }
}


loadDatabase();