// Globals
var sqlite3 = require("sqlite3").verbose();  // use sqlite
var fs = require("fs");

var dbFileName = "PhotoQ.db";
// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFileName);

function dumpDB() {
    db.all ('Select * FROM photoTags', dataCallback);

    function dataCallback(err, data) {
        console.log(data);
    }
}

dumpDB();
