/*
This module provides helper methods to allow the application to interact with a MongoDB database.
*/

var MongoClient = require('mongodb').MongoClient;

function DB() {
	this.db = null;			// The MongoDB database connection
}

DB.prototype.connect = function(uri) {

	// Connect to the database specified by the connect string / uri
	
	// Trick to cope with the fact that "this" will refer to a different
	// object once in the promise's function.
	var _this = this;
	
	// This method returns a javascript promise (rather than having the caller
	// supply a callback function).

	return new Promise(function(resolve, reject) {
		if (_this.db) {
			// Already connected
			resolve();
		} else {
			var __this = _this;
			
			// Many methods in the MongoDB driver will return a promise
			// if the caller doesn't pass a callback function.
			MongoClient.connect(uri)
			.then(
				function(database) {
					
					// The first function provided as a parameter to "then"
					// is called if the promise is resolved successfuly. The 
					// "connect" method returns the new database connection
					// which the code in this function sees as the "database"
					// parameter

					// Store the database connection as part of the DB object so
					// that it can be used by subsequent method calls.

					__this.db = database;

					// Indicate to the caller that the request was completed succesfully,
					// No parameters are passed back.

					resolve();
				},
				function(err) {

					// The second function provided as a parameter to "then"
					// is called if the promise is rejected. "err" is set to 
					// to the error passed by the "connect" method.

					console.log("Error connecting: " + err.message);

					// Indicate to the caller that the request failed and pass back
					// the error that was returned from "connect"

					reject(err.message);
				}
			)
		}
	})
}

DB.prototype.close = function() {
	
	// Close the database connection. This if the connection isn't open
	// then just ignore, if closing a connection fails then log the fact
	// but then move on. This method returns nothing – the caller can fire
	// and forget.

	if (this.db) {
		this.db.close()
		.then(
			function() {},
			function(error) {
				console.log("Failed to close the database: " + error.message)
			}
		)	
	}
}

DB.prototype.countDocuments = function(coll) {
	
	// Returns a promise which resolves to the number of documents in the 
	// specified collection.

	var _this = this;

	return new Promise(function (resolve, reject){

		// {strict:true} means that the count operation will fail if the collection
		// doesn't yet exist

		_this.db.collection(coll, {strict:true}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error.message);
			} else {
				collection.count()
				.then(
					function(count) {
						// Resolve the promise with the count
						resolve(count);
					},
					function(err) {
						console.log("countDocuments failed: " + err.message);
						// Reject the promise with the error passed back by the count
						// function
						reject(err.message);
					}
				)
			}
		});
	})
}

DB.prototype.sampleCollection = function(coll, numberDocs) {

	// Returns a promise which is either resolved with an array of 
	// "numberDocs" from the "coll" collection or is rejected with the
	// error passed back from the database driver.

	var _this = this;

	return new Promise(function (resolve, reject){
		_this.db.collection(coll, {strict:true}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error.message);
			} else {

				// Create a cursor from the aggregation request

				var cursor = collection.aggregate([
					{
						$sample: {size: parseInt(numberDocs)}
					}],
					{ cursor: { batchSize: 10 } }
				)

				// Iterate over the cursor to access each document in the sample
				// result set. Could use cursor.each() if we wanted to work with
				// individual documents here.

				cursor.toArray(function(error, docArray) {
			    	if (error) {
						console.log("Error reading fron cursor: " + error.message);
						reject(error.message);
					} else {
						resolve(docArray);
					}
		    	})
			}
		})
	})
}

DB.prototype.updateCollection = function(coll, pattern, update) {
	
	// Return a promise that either resolves (passing the number of documents
	// that have been updated) or rejected with the error received from the
	// database. The "pattern" is used to match the required documents from the
	// collection – to which the "update" is applied.

	var _this=this;

	return new Promise(function (resolve, reject) {
		_this.db.collection(coll, {strict:true}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error.message);
			} else {

				// Setting the write concern to 1 ({w:1}) means that we don't
				// wait for the changes to be replicated to any of the secondaries – 
				// OK for a tool like this as it speeds things up at the expense of
				// resiliency but most applications would use a "majority" write concern.

				collection.updateMany(pattern, update, {w:1})
				.then(
					function(result) {
						resolve(result.result.nModified);
					},
					function(err) {
						console.log("updateMany failed: " + err.message);
						reject(err.message);
					}
				)
			}
		})
	})
}

DB.prototype.popCollection = function(coll, docs) {
	// Takes the passed array of JSON documents and writes them to the 
	// specified collection. Returns a promise that resolves with the number
	// of documents added or is rejected with an error.

	var _this = this;
	return new Promise(function (resolve, reject){
		_this.db.collection(coll, {strict:false}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error.message);
			} else {

				// Verify that it's really an array
				if (!Array.isArray(docs)) {
					console.log("Data is not an array");

					// Reject the promise with a new error object
					reject({"message": "Data is not an array"});
				} else {
					// Insert the array of documents

					// insertMany updates the original array by adding _id's; we don't 
					// want to change our original array so take a copy. "JSON.parse" 
					// throws an exception rather than returning an error and so we need
					// to catch it.

					try {
						var _docs = JSON.parse(JSON.stringify(docs));
					} catch(trap) {
						reject("Array elements are not valid JSON");
					}

					collection.insertMany(_docs)
					.then(
						function(results) {
							resolve(results.insertedCount);
						},
						function(err) {
							console.log("Failed to insert Docs: " + err.message);
							reject(err.message);
						}
					)
				}
			}
		})
	})
}

DB.prototype.addDocument = function(coll, document) {
	
	// Return a promise that either resolves or is rejected with the error
	// received from the database.

	var _this=this;

	return new Promise(function (resolve, reject) {
		_this.db.collection(coll, {strict:false}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error.message);
			} else {

				collection.insert(document, {w: "majority"})
				.then(
					function(result) {
						resolve();
					},
					function(err) {
						console.log("Insert failed: " + err.message);
						reject(err.message);
					}
				)
			}
		})
	})
}

DB.prototype.mostRecentDocument = function(coll) {
	
	// Return a promise that either resolves with the most recent docucment
	// from the collection (based on a reverse sort on `_id` or is rejected with the error
	// received from the database.

	var _this=this;

	return new Promise(function (resolve, reject) {
		_this.db.collection(coll, {strict:false}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error.message);
			} else {
				var cursor = collection.find({}).sort({_id: -1}).limit(1);
				cursor.toArray(function(error, docArray) {
			    	if (error) {
						console.log("Error reading fron cursor: " + error.message);
						reject(error.message);
					} else {
						resolve(docArray[0]);
					}
		    	})
			}
		})
	})
}

// Make the module available for use in other files
module.exports = DB;