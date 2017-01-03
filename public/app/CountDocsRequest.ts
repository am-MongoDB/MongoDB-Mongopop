export class CountDocsRequest {
	MongoDBURI: string;
	collectionName: string;

	constructor(MongoDBURI?: string, collectionName?: string) {
		this.MongoDBURI = MongoDBURI;
		this.collectionName = collectionName;
	}
}