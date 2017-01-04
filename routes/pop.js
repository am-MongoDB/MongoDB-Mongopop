/*
Defines and implements the Mongopop Restful API.
*/

var MongoClient	= require('mongodb').MongoClient;
var getIP 		= require('external-ip')();
var request 	= require("request");
var express 	= require('express');
var router 		= express.Router();
const util 		= require('util');

var DB 			= require('../javascripts/db');

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

function requestJSON(docURL) {

	// Retrieve an array of example JSON documents from an external source
	// e.g. mockaroo.com. Returns a promise that either resolves to the results 
	// from the JSON service or rejects with the received error.

	return new Promise(function (resolve, reject){
		request({url: docURL, json: true}, function (error, response, body) {
		    if (error || response.statusCode != 200) {
		    	console.log("Failed to fetch documents: " + error.message);
		    	reject(error);
		    } else {
		    	console.log("Fetched documents");
		    	resolve(body);
		    }
		})
	})
}

router.post('/addDocs', function(req, res, next) {

	var requestBody = req.body;
	var uniqueDocs = req.body.unique;
	console.log("Received Post: " + JSON.stringify(req.body));

	// Can be problems with https - this is random sample data so by
	// definition shouldn't need to be private
	docURL = requestBody.dataSource.replace('https', 'http');

	var batchesCompleted = 0;
	var database = new DB;

	console.log("Just about to connect");
	database.connect(requestBody.MongoDBURI)
	.then(
		function() {
			if (uniqueDocs) {
				for (i = 0; i < requestBody.numberDocs; i++) {
					requestJSON(docURL)
					.then(
						function(docs) {
							database.popCollection(requestBody.collectionName, docs)
							.then(
								function(results) {
									console.log('Wrote Mock data batch');
									batchesCompleted++;
								},
								function(error) {
									database.close();
									resultObject = {
										"success": false,
										"count": batchesCompleted,
										"error": "Failed to write mock data: " + error.message
									};
									return res.json(resultObject);
								}
							)
							.then(
								function() {
									console.log(batchesCompleted + ' batches completed out of ' + requestBody.numberDocs);
									if (batchesCompleted == requestBody.numberDocs) {
										console.log('Wrote all Mock data');
											resultObject = {
												"success": true,
												"count": batchesCompleted,
												"error": ""
											};
										database.close();
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
				// Fetch one set of sample data and then use for repeated writes
				requestJSON(docURL)
				.then(
					function(docs) {
						var taskList = [];
						for (i = 0; i < requestBody.numberDocs; i++) {
							taskList.push(database.popCollection(requestBody.collectionName, docs))
						}
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
									"count": 0,
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

	var requestBody = req.body;
	var database = new DB;

	console.log("Received sample request: " + JSON.stringify(req.body));
	
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
			console.log('Retrieved sample data');
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

	var requestBody = req.body;
	var database = new DB;

	console.log("Received count request: " + JSON.stringify(req.body));
	database.connect(requestBody.MongoDBURI)
	.then(
		function() {
			return database.countDocuments(requestBody.collectionName)
		},
		function(err) {
			console.log("Failed to connect to the database: " + err.message);
			console.log(err);
			return {
					"success": false,
					"count": 0,
					"error": "Failed to connect to the database: " + err.message
				};
		})
	.then(
		function(count) {
			console.log("Counted " + count + " documents");
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

/*
router.get('/countDocs', function(req, res, next) {

	var MongoDBURI = req.MongoDBURI;
	var collectionName = req.collectionName;

	var database = new DB;

	console.log("Received count (get) request: URI=" + MongoDBURI +
		" collectionName=" + collectionName);
	database.connect(MongoDBURI)
	.then(
		function() {
			return database.countDocuments(collectionName)
		},
		function(err) {
			console.log("Failed to connect to the database: " + err.message);
			console.log(err);
			return {
					"success": false,
					"count": 0,
					"error": "Failed to connect to the database: " + err.message
				};
		})
	.then(
		function(count) {
			console.log("Counted " + count + " documents");
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
*/

function add(a, b) {
    return a + b;
}

router.post('/updateDocs', function(req, res, next) {

	var requestBody = req.body;
	var database = new DB;

	console.log("Received update request: " + JSON.stringify(req.body));
	database.connect(requestBody.MongoDBURI)
	.then(
		function() {
			var taskList = []
			for (var i=0; i < requestBody.threads; i++) {
				taskList.push(database.updateCollection(
					requestBody.collectionName,
					requestBody.matchPattern,
					requestBody.dataChange));
			}

			var allPromise = Promise.all(taskList);
			allPromise
			.then(
				function(values) {
					documentsUpdated = values.reduce(add, 0);
					console.log("Sending response; " + documentsUpdated + " docs updated.");
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
								"error": error.message
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
						"error": error.message
					};
			console.log("About to send error response");
			res.json(resultObject);	
		}
	);
})

module.exports = router;