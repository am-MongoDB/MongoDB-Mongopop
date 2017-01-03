export class SampleDocsRequest {
	MongoDBURI: string;
	collectionName: string;
	numberDocs: number;

	constructor(MongoDBURI?: string, collectionName?: string, numberDocs?: number) {
		this.MongoDBURI = MongoDBURI;
		this.collectionName = collectionName;
		this.numberDocs = numberDocs;
	}
}