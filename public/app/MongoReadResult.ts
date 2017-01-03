export class MongoReadResult {
	success: boolean;
	documents: string;
	error: string;

	constructor(success: boolean, documents?: string, error?: string) {
		this.success = success;
		this.documents = documents;
		this.error = error;
	}
}