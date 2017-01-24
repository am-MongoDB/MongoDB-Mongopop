/*
Defines and implements the Mongopop Restful API by adding 'get' and 'post'
routes to the router.
*/

var getIP = require('external-ip')();
var request = require("request");
var express = require('express');
var router 	= express.Router();
const util 	= require('util');

var DB = require('../javascripts/db');

var publicIP; // IP address of the server running the Mongopop service
var title = "MongoPop – Populate your MongoDB (Atlas) Database"

getIP(function (err, ip) {

	// Returns the IP address of the server where the Mongopop service is running

    if (err) {
    	console.log("Failed to retrieve IP address: " + err.message);
        throw err;
    }
    console.log("Mongopop API running on " + ip + ":3000");
    publicIP = ip;
});

router.get('/', function(req, res, next) {

	// This isn't part of API and is just used from a browser or curl to test that
	// "/pop" is being routed correctly.

	var testObject = {
		"AppName": "MongoPop",
		"Version": 0.4
	}
	var testString = JSON.stringify(testObject);
	res.json(testObject);
});

router.get('/ip', function(req, res, next) {

	// Sends a response with the IP address of the server running this service.

	res.json({"ip":publicIP});
});

function requestJSON(requestURL) {

	// Retrieve an array of example JSON documents from an external source
	// e.g. mockaroo.com. Returns a promise that either resolves to the results 
	// from the JSON service or rejects with the received error.

	return new Promise(function (resolve, reject){

		// Mockaroo can have problems with https - this is random sample data so by
		// definition shouldn't need to be private
		finalDocURL = requestURL.replace('https', 'http');

		request({url: finalDocURL, json: true}, function (error, response, body) {
		    if (error || response.statusCode != 200) {
		    	console.log("Failed to fetch documents: " + error.message);
		    	reject(error);
		    } else {
		    	resolve(body);
		    }
		})
	})
}

router.post('/addDocs', function(req, res, next) {

	/* Request from client to add a number of documents to a collection; the request
	should be of the form:

	{
		MongoDBURI: string; // Connect string for MongoDB instance
		collectionName: string; 
		dataSource: string; // e.g. a Mockaroo.com URL to produce example docs
		numberDocs: number; // How many (in thousands) documents sould be added
		unique: boolean; 	// Whether each batch of 1,000 documents should be distinct
							// from the others (much slower if set to true)
	}

	The response will contain:

	{
		success: boolean;	
		count: number;		// How many documents were added (in thousands)
		error: string;
	}
	*/

	var requestBody = req.body;
	var uniqueDocs = req.body.unique;
	var batchesCompleted = 0;
	var database = new DB;
	var docURL = requestBody.dataSource;

	database.connect(requestBody.MongoDBURI)
	.then(
		function() {
			if (uniqueDocs) {

				// Need to fetch another batch of unique documents for each batch
				// of 1,000 docs

				for (i = 0; i < requestBody.numberDocs; i++) {
					
					// Fetch the example documents (based on the caller's source URI)

					requestJSON(docURL)
					.then(
						function(docs) {

							// The first function provided as a parameter to "then"
							// is called if the promise is resolved successfully. The 
							// "requestJSON" method returns the retrieved documents
							// which the code in this function sees as the "docs"
							// parameter. Write these docs to the database:

							database.popCollection(requestBody.collectionName, docs)
							.then(
								function(results) {
									batchesCompleted++;
								},
								function(error) {

									// The second function provided as a parameter to "then"
									// is called if the promise is rejected. "err" is set to 
									// to the error passed by popCollection

									database.close();
									resultObject = {
										"success": false,
										"count": batchesCompleted,
										"error": "Failed to write mock data: " + error.message
									};

									// Include "return" to end execution of this function

									return res.json(resultObject);
								}
							)
							.then(
								function() {

									// If all off the batches have been (successfully) added
									// then build and send the response.

									if (batchesCompleted == requestBody.numberDocs) {
										database.close();
										console.log('Wrote all Mock data');
											resultObject = {
												"success": true,
												"count": batchesCompleted,
												"error": ""
											};
										return res.json(resultObject);
									}
								}
							)
						},
						function(error) {
							database.close();
							resultObject = {
								"success": false,
								"count": batchesCompleted,
								"error": "Failed to fetch mock data: " + error.message
							};
							return res.json(resultObject);
						}
					)
				}
			} else {
				
				// Fetch one set of sample data and then use for repeated batches of writes

				requestJSON(docURL)
				.then(
					function(docs) {

						// Build an array of popCollection calls (not being executed at this point)

						var taskList = [];
						for (i = 0; i < requestBody.numberDocs; i++) {
							taskList.push(database.popCollection(requestBody.collectionName, docs))
						}

						// Promise.all executes all of the tasks in the provided array asynchronously (i.e.
						// they can run in parallel).

						var allPromise = Promise.all(taskList);
						allPromise
						.then(
							function(result) {
								database.close();
								resultObject = {
									"success": true,
									"count": requestBody.numberDocs,
									"error": ""
								};
								return res.json(resultObject);
							},
							function(error) {
								database.close();
								resultObject = {
									"success": false,
									"count": 0, // If some writes succeeded then the real count may be > 0
									"error": "Failed to write data: " + error.message
								};
								return res.json(resultObject);
							}
						)
					},
					function(error) {
						database.close();
						resultObject = {
							"success": false,
							"count": 0,
							"error": "Failed to fetch mock data: " + error.message
						};
						return res.json(resultObject);
					}
				)
			}
		},
		function(error) {
			resultObject = {
						"success": false,
						"count": 0,
						"error": "Failed to connect to database: " + error.message
					};
			return res.json(resultObject);
		}
	)
})

router.post('/sampleDocs', function(req, res, next) {

	/* Request from client to read a sample of the documents from a collection; the request
	should be of the form:

	{
		MongoDBURI: string; // Connect string for MongoDB instance
		collectionName: string;
		numberDocs: number; // How many documents should be in the result set
	}

	The response will contain:

	{
		success: boolean;	
		documents: string;	// Sample of documents from collection
		error: string;
	}
	*/

	var requestBody = req.body;
	var database = new DB;
	
	database.connect(requestBody.MongoDBURI)
	.then(
		function() {
			return database.sampleCollection(
				requestBody.collectionName,
				requestBody.numberDocs)
		},
		function(error) {
			resultObject = {
					"success": false,
					"count": 0,
					"error": "Failed to connect to database: " + error.message
				};
			return res.json(resultObject);
		})
	.then(
		function(docs) {
			return {
					"success": true,
					"documents": docs,
					"error": ""
				};
		},
		function(error) {
			console.log('Failed to retrieve sample data: ' + error.message);
			return {
					"success": false,
					"documents": null,
					"error": "Failed to retrieve sample data: " + error.message
				};
		})
	.then(
		function(resultObject) {
			database.close();
			res.json(resultObject);
		}
	)
})

router.post('/countDocs', function(req, res, next) {

	/* Request from client to count the number of documents in a 
	collection; the request should be of the form:

	{
		MongoDBURI: string; // Connect string for MongoDB instance
		collectionName: string;
	}

	The response will contain:

	{
		success: boolean;	
		count: number;		// The number of documents in the collection
		error: string;
	}
	*/

	var requestBody = req.body;
	var database = new DB;

	database.connect(requestBody.MongoDBURI)
	.then(
		function() {
			return database.countDocuments(requestBody.collectionName)
		},
		function(err) {
			console.log("Failed to connect to the database: " + err.message);
			return {
					"success": false,
					"count": 0,
					"error": "Failed to connect to the database: " + err.message
				};
		})
	.then(
		function(count) {
			return {
					"success": true,
					"count": count,
					"error": ""
				};
		},
		function(err) {
			console.log("Failed to count the documents: " + err.message);
			return {
					"success": false,
					"count": 0,
					"error": "Failed to count the documents: " + err.message
				};
		})
	.then(
		function(resultObject) {
			database.close();
			res.json(resultObject);
		})
})

function add(a, b) {
    return a + b;
}

router.post('/updateDocs', function(req, res, next) {

	/* Request from client to apply an update to all documents in a collection
	which match a given pattern; the request should be of the form:

	{
		MongoDBURI: string; 	// Connect string for MongoDB instance
		collectionName: string;
		matchPattern: Object;	// Filter to determine which documents should 
								// be updated (e.g. '{"gender": "Male"}'')
		dataChange: Object;		// Change to be applied to each matching change
								// (e.g. '{"$set": {"mmyComment": "This is a 
								// man"}, "$inc": {"myCounter": 1}}')
		threads: number;		// How many times to repeat (in parallel) the operation
	}

	The response will contain:

	{
		success: boolean;	
		count: number;			// The number of documents updated (should be the
								// the number of documents matching the pattern
								// multiplied by the number of threads)
		error: string;
	}
	*/

	var requestBody = req.body;
	var database = new DB;

	database.connect(requestBody.MongoDBURI)
	.then(
		function() {

			// Build up a list of the operations to be performed

			var taskList = []
			for (var i=0; i < requestBody.threads; i++) {
				taskList.push(database.updateCollection(
					requestBody.collectionName,
					requestBody.matchPattern,
					requestBody.dataChange));
			}

			// Asynchronously run all of the operations

			var allPromise = Promise.all(taskList);
			allPromise
			.then(
				function(values) {
					documentsUpdated = values.reduce(add, 0);
					return {
								"success": true,
								"count": documentsUpdated,
								"error": {}
							};
				},
				function(error) {
					console.log("Error updating documents" + error.message);
					return {
								"success": false,
								"count": 0,
								"error": "Error updating documents: " + error.message
							};
				}
			)
			.then(
				function(resultObject) {
					database.close();
					res.json(resultObject);
				}
			)
		},
		function(error) {
			console.log("Failed to connect to the database: " + error.message);
			resultObject = {
						"success": false,
						"count": 0,
						"error": "Failed to connect to the database: " + error.message
					};
			res.json(resultObject);	
		}
	);
})

module.exports = router;