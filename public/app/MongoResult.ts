export class MongoResult {
	success: boolean;
	count: number;
	error: string;

	constructor(success: boolean, count?: number, error?: string) {
		this.success = success;
		this.count = count;
		this.error = error;
	}
}