export class ClientConfig {
	mongodb: {
			defaultDatabase: string;
			defaultCollection: string;
			defaultUri: string;
			};
	mockarooUrl: string;

	constructor(databaseName?: string, collectionName?: string, mongodbURI?: string,
	 dataSource?: string) {
		this.mongodb.defaultDatabase = databaseName;
		this.mongodb.defaultCollection = collectionName;
		this.mongodb.defaultUri = mongodbURI;
		this.mockarooUrl = dataSource;
	}
}