// Globals
var sqlite3 = require("sqlite3").verbose();  // use sqlite
var fs = require("fs");
var sizeOf = require('image-size');

var dbFileName = "PhotoQ.db";
// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFileName);

function loadFiles() {
	var file = fs.readFileSync('6whs.json', 'utf8');
	var obj = JSON.parse(file);
	console.log(obj.photoURLs[0]);
	
}

loadFiles();
