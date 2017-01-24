var DB = require('./javascripts/db');

function count (MongoDBURI, collectionName) {

	var database = new DB;

	database.connect(MongoDBURI)
	.then(
		function() {
			// Make the database call and pass the returned promise to the next stage
			return database.countDocuments(collectionName)
		},
		function(err) {
			console.log("Failed to connect to the database: " + err);
			return 0;
		})
	// The following `.then` clause uses the promise returned by the previous one.
	.then(
		function(count) {
			console.log(count + " documents");
			return count;
		},
		function(err) {
			console.log("Failed to count the documents: " + err);
			return 0;
		})
	.then(
		function() {
			database.close();
		})
}

count("mongodb://localhost:27017/mongopop", "simples");
