/*
Service for clients to access the Mongopop and MongoDB Atlas web APIs
*/

import { Injectable, OnInit } 						from '@angular/core';
import { Http, Response, Headers, RequestOptions } 	from '@angular/http';
import { Observable, Subscription } 				from 'rxjs/Rx';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { MongoResult } 								from './MongoResult'; 
import { ClientConfig }								from './ClientConfig';
import { AddDocsRequest } 							from './AddDocsRequest';
import { SampleDocsRequest } 						from './SampleDocsRequest';
import { MongoReadResult } 							from './MongoReadResult';
import { UpdateDocsRequest } 						from './UpdateDocsRequest';
import { CountDocsRequest } 						from './CountDocsRequest';

@Injectable()
export class DataService {

	private MongoDBURI: string;	// The URI to use when accessing the MongoDB database
	private baseURL: string = "http://localhost:3000/pop/";	// The URL for the Mongopop service

	constructor (private http: Http) {
	}

	fetchServerIP() : Observable<string> {

		// Ask the MongoPop API for its IP address
		return this.http.get(this.baseURL + "ip")
		.map(response => response.json().ip)
		.catch((error:any) => Observable.throw(error.json().error || 'Server error'))
	}

	fetchClientConfig() : Observable<ClientConfig> {
		return this.http.get(this.baseURL + "config")
		.map(response => response.json())
		.catch((error:any) => Observable.throw(error.json().error || 'Server error'))
	}

	setMongoDBURI(MongoDBURI: string) {
		this.MongoDBURI = MongoDBURI;
	}

	calculateMongoDBURI(dbInputs: any): {"MongoDBURI": string, "MongoDBURIRedacted": string}
	{
		/* 
		Returns the URI for accessing the database; if it's for MongoDB Atlas then include the password and
		use the chosen database name rather than 'admin'. Also returns the redacted URI (with the password
		masked).
		*/
		let MongoDBURI: string;
		let MongoDBURIRedacted: string;

		if (dbInputs.MongoDBBaseURI == "mongodb://localhost:27017") {
			MongoDBURI = dbInputs.MongoDBBaseURI
				+ "/" + dbInputs.MongoDBDatabaseName
				+ "?authSource=admin&socketTimeoutMS="
				+ dbInputs.MongoDBSocketTimeout*1000
				+ "&maxPoolSize="
				+ dbInputs.MongoDBConnectionPoolSize;
			MongoDBURIRedacted = dbInputs.MongoDBBaseURI;
		} else {
			// Can now assume that the URI is in the format provided by MongoDB Atlas
			dbInputs.MongoDBUser = dbInputs.MongoDBBaseURI.split('mongodb://')[1].split(':')[0];
			MongoDBURI = dbInputs.MongoDBBaseURI
				.replace('<DATABASE>', dbInputs.MongoDBDatabaseName)
				.replace('<PASSWORD>', dbInputs.MongoDBUserPassword)
				+ "&socketTimeoutMS="
				+ dbInputs.MongoDBSocketTimeout*1000
				+ "&maxPoolSize="
				+ dbInputs.MongoDBConnectionPoolSize;
			MongoDBURIRedacted = dbInputs.MongoDBBaseURI
				.replace('<DATABASE>', dbInputs.MongoDBDatabaseName)
				.replace('<PASSWORD>', "**********")
				+ "&socketTimeoutMS="
				+ dbInputs.MongoDBSocketTimeout*1000
				+ "&maxPoolSize="
				+ dbInputs.MongoDBConnectionPoolSize;
		}

		this.setMongoDBURI(MongoDBURI);
		return({"MongoDBURI": MongoDBURI, 
				"MongoDBURIRedacted": MongoDBURIRedacted});
	}

	tryParseJSON (jsonString: string): Object{

		/*
		Attempts to build an object from the supplied string. Raises an error if
		the conversion fails (e.g. if it isn't valid JSON format).
		*/

	    try {
	        let myObject = JSON.parse(jsonString);

	        if (myObject && typeof myObject === "object") {
	            return myObject;
	        }
	    }
	    catch (error) { 
	    	let errorString = "Not valid JSON: " + error.message;
	    	console.log(errorString);
	    	new Error(errorString);
	    }
	    return {};
	};

	sendUpdateDocs(doc: UpdateDocsRequest) : Observable<MongoResult> {
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });
		let url: string = this.baseURL + "updateDocs";

		return this.http.post(url, doc, options)
		.timeout(360000000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() ||  " Server error")
		});
	}; 

	updateDBDocs (collName: string, matchPattern: string, dataChange: string, 
			threads: number): Observable<MongoResult> {
		
		/*
		Apply an update to all documents in a collection
		which match a given pattern. Uses the MongoPop API.
		Returns an Observable which either resolves to the results of the operation
		or throws an error.
		*/
		let matchObject: Object;
		let changeObject: Object;

		try {
			matchObject = this.tryParseJSON(matchPattern);
			}
		catch (error) {
			let errorString = "Match pattern: " + error.message;
	    	console.log(errorString);
	    	return Observable.throw(errorString);
		}
		
		try	{
			changeObject = this.tryParseJSON(dataChange);
		}
		catch (error) {
			let errorString = "Data change: " + error.message;
	    	console.log(errorString);
	    	return Observable.throw(errorString);
		}

		let updateDocsRequest = new UpdateDocsRequest (this.MongoDBURI, collName, matchObject, changeObject, threads);

		return this.sendUpdateDocs(updateDocsRequest)
		.map(results => {return results})
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		})
	}

	sendCountDocs(CollName: string) : Observable<MongoResult> {

		/*
		Use the Mongopop API to count the number of documents in the specified
		collection.
		It returns an Observable that delivers objects of type MongoResult.
		*/

		
		// Need to indicate that the request parameters will be in the form
		// of a JSON document
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({headers: headers});

		// The CountDocsRequest class contains the same elements as the 
		// `pop/count` REST API POST method expects to receive
		let countDocsRequest = new CountDocsRequest (this.MongoDBURI, CollName);
		let url: string = this.baseURL + "countDocs";

		return this.http.post(url, countDocsRequest, options)
		.timeout(360000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		});
	};

	sendAddDoc(CollName:string, DocURL: string, DocCount: number, 
			Unique: boolean) : Observable<MongoResult> {

		/*
		Use the Mongopop API to add the requested number (in thousands) of documents
		to the collection. The documents are fetched from a service such as Mockaroo 
		using the DocURL.
		Returns an Observable which either resolves to the results of the operation
		or throws an error.
		*/

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });
		let addDocsRequest = new AddDocsRequest (this.MongoDBURI, CollName, DocURL, DocCount, Unique);
		let url: string = this.baseURL + "addDocs";

		return this.http.post(url, addDocsRequest, options)
		.timeout(360000000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		});
	}; 

	sendSampleDoc(CollName:string, NumberDocs: number) : Observable<MongoReadResult> {

		/*
		Use the Mongopop API to request a sample of the documents from a collection.
		Returns an Observable which either resolves to the results of the operation
		or throws an error.
		*/

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers});
		let sampleDocsRequest = new SampleDocsRequest (this.MongoDBURI, CollName, NumberDocs);
		let url: string = this.baseURL + "sampleDocs";

		return this.http.post(url, sampleDocsRequest, options)
		.timeout(360000, new Error('Timeout exceeded'))
		.map(response => response.json())
		.catch((error:any) => {
			return Observable.throw(error.toString() || ' Server error')
		});
	};
}


