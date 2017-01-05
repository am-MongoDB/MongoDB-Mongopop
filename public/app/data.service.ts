import { Injectable, OnInit } 						from '@angular/core';
import { Http, Response, Headers, RequestOptions } 	from '@angular/http';
import { Observable, Subscription } 				from 'rxjs/Rx';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { MongoResult } 								from './MongoResult'; 
import { AddDocsRequest } 							from './AddDocsRequest';
import { SampleDocsRequest } 						from './SampleDocsRequest';
import { MongoReadResult } 							from './MongoReadResult';
import { UpdateDocsRequest } 						from './UpdateDocsRequest';
import { CountDocsRequest } 						from './CountDocsRequest';

@Injectable()
export class DataService {

	private MongoDBURI: string;
	private baseURL: string;

	constructor (private http: Http) {}

	fetchServerIP(baseURL: string) : Observable<string> {
		return this.http.get(baseURL + "/ip")
		.map(response => response.json().ip)
		.catch((error:any) => Observable.throw(error.json().error || 'Server error'))
	}

	setMongoDBURI(MongoDBURI: string) {
		this.MongoDBURI = MongoDBURI;
	}

	setBaseURL(baseURL: string) {
		this.baseURL = baseURL;
	}

	calculateMongoDBURI(dbInputs: any): {"MongoDBURI": string, "MongoDBURIRedacted": string}
	{
		console.log("calculating URI – Service Style!");
		var MongoDBURI: string;
		var MongoDBURIRedacted: string;
		if (dbInputs.MongoDBBaseURI == "mongodb://localhost:27017") {
			console.log("Still using localhost");
			MongoDBURI = dbInputs.MongoDBBaseURI + "/" 
			+ dbInputs.MongoDBDatabaseName + "?authSource=admin&socketTimeoutMS=" + dbInputs.MongoDBSocketTimeout*1000 + "&maxPoolSize=" + dbInputs.MongoDBConnectionPoolSize;
			MongoDBURIRedacted = dbInputs.MongoDBBaseURI;
			console.log(MongoDBURI);
		} else {
			console.log("Now using remote MongoDB");
			dbInputs.MongoDBUser = dbInputs.MongoDBBaseURI.split('mongodb://')[1].split(':')[0];
			MongoDBURI = dbInputs.MongoDBBaseURI
				.replace('admin', dbInputs.MongoDBDatabaseName)
				.replace('PASSWORD', dbInputs.MongoDBUserPassword) + "&socketTimeoutMS=" + dbInputs.MongoDBSocketTimeout*1000 + "&maxPoolSize=" + dbInputs.MongoDBConnectionPoolSize;
			MongoDBURIRedacted = dbInputs.MongoDBBaseURI
				.replace('admin', dbInputs.MongoDBDatabaseName)
				.replace('PASSWORD', "**********") + 
				+ "&socketTimeoutMS=" + dbInputs.MongoDBSocketTimeout*1000 + "&maxPoolSize=" + dbInputs.MongoDBConnectionPoolSize;
		}
		this.setMongoDBURI(MongoDBURI);
		return({"MongoDBURI": MongoDBURI, 
				"MongoDBURIRedacted": MongoDBURIRedacted});
	}

	tryParseJSON (jsonString: string): Object{
	    try {
	        var myObject = JSON.parse(jsonString);

	        if (myObject && typeof myObject === "object") {
	            return myObject;
	        }
	    }
	    catch (error) { 
	    	var errorString = "Not valid JSON: " + error.message;
	    	console.log(errorString);
	    	new Error(errorString);
	    }
	    return {};
	};

	sendUpdateDocs(doc: UpdateDocsRequest) : Observable<MongoResult> {
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		var docJSON = JSON.stringify(doc);
		var url: string = this.baseURL + "updateDocs";
		console.log("Sending updateDocs request: " + docJSON + "to" + url);

		return this.http.post(url, doc, options)
		.timeout(360000000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() ||  " Server error")
		});
	}; 

	updateDBDocs (collName: string, matchPattern: string, dataChange: string, 
			threads: number): Observable<MongoResult> {
		try {
			var matchObject: Object = this.tryParseJSON(matchPattern);
			}
		catch (error) {
			var errorString = "Match pattern: " + error.message;
	    	console.log(errorString);
	    	return Observable.throw(errorString);
		}
		
		try	{
				var changeObject: Object = this.tryParseJSON(dataChange);
		}
		catch (error) {
			var errorString = "Data change: " + error.message;
	    	console.log(errorString);
	    	return Observable.throw(errorString);
		}

		var updateDocsRequest = new UpdateDocsRequest (this.MongoDBURI, collName, matchObject, changeObject, threads);
		console.log("About to send " + JSON.stringify(updateDocsRequest));

		return this.sendUpdateDocs(updateDocsRequest)
		.map(results => {return results})
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		})
	}

	sendCountDocs(CollName: string) : Observable<MongoResult> {
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers});
		let countDocsRequest = new CountDocsRequest (this.MongoDBURI, CollName);

		console.log("About to send " + JSON.stringify(countDocsRequest));

		var docJSON = JSON.stringify(countDocsRequest);
		var url: string = this.baseURL + "countDocs";
		console.log("Sending countDocs request: " + docJSON + " to " + url);

		return this.http.post(url, countDocsRequest, options)
		.timeout(360000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		});
	};

	sendAddDoc(CollName:string, DocURL: string, DocCount: number, 
			Unique: boolean) : Observable<MongoResult> {
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });
		let addDocsRequest = new AddDocsRequest (this.MongoDBURI, CollName, DocURL, DocCount, Unique);
		let docJSON = JSON.stringify(addDocsRequest);
		let url: string = this.baseURL + "addDocs";
		console.log("Sending addDocs request: " + docJSON + "to" + url);

		return this.http.post(url, addDocsRequest, options)
		.timeout(360000000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		});
	}; 

	sendSampleDoc(CollName:string, NumberDocs: number) : Observable<MongoReadResult> {
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers});
		let sampleDocsRequest = new SampleDocsRequest (this.MongoDBURI, CollName, NumberDocs);

		console.log("About to send " + JSON.stringify(sampleDocsRequest));
		var docJSON = JSON.stringify(sampleDocsRequest);
		var url: string = this.baseURL + "sampleDocs";
		console.log("Sending sampleDocs request: " + docJSON + "to" + url);

		return this.http.post(url, sampleDocsRequest, options)
		.timeout(360000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		});
	};
}

