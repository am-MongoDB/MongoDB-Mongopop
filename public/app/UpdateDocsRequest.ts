export class UpdateDocsRequest {
	MongoDBURI: string;
	collectionName: string;
	matchPattern: Object;
	dataChange: Object;
	threads: number;

	constructor(MongoDBURI?: string, collectionName?: string, matchPattern?: Object, dataChange?: Object, threads?: number) {
		this.MongoDBURI = MongoDBURI;
		this.collectionName = collectionName;
		this.matchPattern = matchPattern;
		this.dataChange = dataChange;
		this.threads = threads;
	}
}
