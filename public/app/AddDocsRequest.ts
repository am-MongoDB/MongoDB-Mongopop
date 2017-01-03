export class AddDocsRequest {
	MongoDBURI: string;
	collectionName: string;
	dataSource: string;
	numberDocs: number;
	unique: boolean;

	constructor(MongoDBURI?: string, collectionName?: string, dataSource?: string, numberDocs?: number, unique?: boolean) {
		this.MongoDBURI = MongoDBURI;
		this.collectionName = collectionName;
		this.dataSource = dataSource;
		this.numberDocs = numberDocs;
		this.unique = unique;
	}
}