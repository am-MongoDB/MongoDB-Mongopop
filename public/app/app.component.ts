import { Component, OnInit, Injectable } 	from '@angular/core';
import { Http, Response } 					from '@angular/http';
import { Observable, Subscription } 		from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DataService }						from './data.service';

@Component({
    selector: 'my-app',
    templateUrl: 'app/app.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class AppComponent implements OnInit { 
	serverIP: string = "";
	MongoDBURIRedacted = "";
	DataToPlayWith: boolean = false;
	dBInputs = {MongoDBBaseURI: "mongodb://localhost:27017",
				MongoDBDatabaseName: "mongopop",
				MongoDBUser: "",
				MongoDBUserPassword: "",
				MongoDBSocketTimeout: 30,
				MongoDBConnectionPoolSize: 20};
	MongoDBCollectionName: string = "simples";

	dBURI = {MongoDBURI: "Not set yet", MongoDBURIRedacted: "Not set yet"};

	private baseURL = 'http://192.168.1.116:3000/pop/';

	constructor (private http: Http, private dataService: DataService) {}

	ngOnInit() {
		this.fetchServerIP().subscribe(
		results => {
			this.serverIP = results
		});
		this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
		this.dataService.setBaseURL(this.baseURL);
	}

	fetchServerIP() : Observable<string> {
		return this.http.get(this.baseURL + "/ip")
		.map(response => response.json().ip)
		.catch((error:any) => Observable.throw(error.json().error || 'Server error'))
	};

	setMongoDBSocketTimeout(timeout: number) {
		this.dBInputs.MongoDBSocketTimeout = timeout;
		this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
	}

	setMongoDBConnectionPoolSize(poolSize: number) {
		this.dBInputs.MongoDBConnectionPoolSize = poolSize;
		this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
	}

	setBaseURI(uri: string) {
		this.dBInputs.MongoDBBaseURI = uri;
		this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
	};

	setDBName(dbName: string) {
		this.dBInputs.MongoDBDatabaseName = dbName;
		this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
	}

	setPassword(password: string) {
		this.dBInputs.MongoDBUserPassword = password;
		this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
	}

	showPassword(choice: boolean) {
		if (choice) {
			this.dBURI.MongoDBURIRedacted = this.dBURI.MongoDBURI;
		} else {
			this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
		}
	}

	onSample(haveSampleData: boolean) {
		this.DataToPlayWith = haveSampleData;
	}

	onCollection(CollName: string) {
		this.MongoDBCollectionName = CollName;
	}
}
