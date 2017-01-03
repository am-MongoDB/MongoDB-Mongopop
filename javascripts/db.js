var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

function DB() {
	this.db = "empty";
}

DB.prototype.connect = function(uri) {
	console.log("Promise: within connect; URI = " + uri);
	var _this = this;
	return new Promise(function(resolve, reject) {
		if (_this.db != "empty") {
			console.log("Database already connected");
			resolve();
		} else {
			var __this = _this;
			MongoClient.connect(uri)
			.then(
				function(database) {
					__this.db = database;
					console.log("Connected to database: ");
					resolve();
				},
				function(err) {
					console.log("Error connecting: " + err.message);
					reject(err);
				}
			)
		}
	})
}

DB.prototype.close = function() {
	console.log("Closing database");
	this.db.close()
	.then(
		function() {
			console.log("Closed database");	
		},
		function(error) {
			console.log("Failed to close the database: " + error)
		}
	)
}

DB.prototype.countDocuments = function(coll) {
	var _this = this;

	return new Promise(function (resolve, reject){
		_this.db.collection(coll, {strict:true}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error);
			} else {
				collection.count()
				.then(
					function(count) {
						console.log("Counted " + count + " documents.");
						resolve(count);
					},
					function(err) {
						console.log("countDocuments failed: " + err.message);
						reject(err);
					}
				)
			}
		});
	})
}

DB.prototype.sampleCollection = function(coll, numberDocs) {
	var _this = this;

	console.log("Requesting " + numberDocs + " docs");
	return new Promise(function (resolve, reject){
		_this.db.collection(coll, {strict:true}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error);
			} else {
				var cursor = collection.aggregate([
					{
						$sample: {size: parseInt(numberDocs)}
					}],
					{ cursor: { batchSize: 1 } }
				)
				var docSet = [];
				cursor.each(function(error, doc) {
			    	if (error) {
						console.log("Error iterating through cursor: " + error.message);
						reject(error);
					} else {
						if (doc) {
							docSet.push(doc);
							console.log("Pushed a sample document")
						} else {
							resolve(docSet);
						}
					}
		    	})
			}
		})
	})
}

DB.prototype.updateCollection = function(coll, pattern, update) {
	
	var _this=this;
	return new Promise(function (resolve, reject) {
		_this.db.collection(coll, {strict:true}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error);
			} else {
				collection.updateMany(pattern, update, {w:1})
				.then(
					function(result) {
						console.log("Updated " + result.result.nModified + " documents.");
						resolve(result.result.nModified);
					},
					function(err) {
						console.log("updateMany failed: " + err);
						reject(err);
					}
				)
			}
		})
	})
}

DB.prototype.popCollection = function(coll, docs) {
	// Takes the passed array of JSON documents and writes them to the 
	// specified collection
	// Access the collection
	
	var _this = this;
	return new Promise(function (resolve, reject){
		_this.db.collection(coll, {strict:false}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error);
			} else {

				// Verify that it's really an array
				if (!Array.isArray(docs)) {
					console.log("Data is not an array");
					reject({"message": "Data is not an array"});
				} else {
					// Insert the array of documents
					// insertMany updates the original array by adding _id's; we don't 
					// want to change our original array so take a copy
					try {
						var _docs = JSON.parse(JSON.stringify(docs));
					} catch(trap) {
						reject({"message": "Array elements are not valid JSON"});
					}
					collection.insertMany(_docs)
					.then(
						function(results) {
							console.log("Inserted " + results.insertedCount + " docs.");
							resolve(results.insertedCount);
						},
						function(err) {
							console.log("Failed to insert Docs: " + err.message);
							reject(err);
						}
					)
				}
			}
		})
	})
}

module.exports = DB;