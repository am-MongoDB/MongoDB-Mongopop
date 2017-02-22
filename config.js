var config = {
	expressPort: 3000,
	client: {
		mongodb: {
			defaultDatabase: "mongopop",
			defaultCollection: "simples",
			defaultUri: "mongodb://localhost:27017"
		},
		mockarooUrl: "http://www.mockaroo.com/536ecbc0/download?count=1000&key=48da1ee0"
	},
	makerMongoDBURI: "mongodb://billy:goldie@cluster0-shard-00-00-qfovx.mongodb.net:27017,cluster0-shard-00-01-qfovx.mongodb.net:27017,cluster0-shard-00-02-qfovx.mongodb.net:27017/maker?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin",
	checkinCollection: "foursq"
};

module.exports = config;
