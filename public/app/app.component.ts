import { Component, OnInit, Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DataService } from './data.service';

@Component({
	// This component will be loaded into the <my-app> element of `../index.html`
    selector: 'my-app',
    templateUrl: 'app/app.component.html',
    styleUrls:  ['stylesheets/style.css']
})

// @Injectable means that dependencies can be implicitly added by including new objects
// in the constructor parameter list.
@Injectable()
export class AppComponent implements OnInit { 
	serverIP: string = "";
	MongoDBURIRedacted = "";	// The MongoDB URI but with the user password hidden
	DataToPlayWith: boolean = false;
	dBInputs = {MongoDBBaseURI: "",
				MongoDBDatabaseName: "",
				MongoDBUser: "",
				MongoDBUserPassword: "",
				MongoDBSocketTimeout: 30,
				MongoDBConnectionPoolSize: 20};
	MongoDBCollectionName: string;
	defaultMockarooURI: string;

	dBURI = {MongoDBURI: "Not set yet", MongoDBURIRedacted: "Not set yet"};

	constructor (private dataService: DataService) {}

	// Called after the constructor
	ngOnInit() {

		// Find the IP address of the server hosting the Mongopop API.
		// fetchServerIP returns an observable which we subscribe to and 
		// await the results.
		this.dataService.fetchServerIP().subscribe(
		results => {
			// This code is invoked if/when the observable is resolved successfully
			this.serverIP = results
		},
		error => {
			// This code is executed if/when the observable throws an error.
			console.log("Failed to find an IP address; will use 127.0.0.1 instead. Reason: " + error.toString);
		});

		// Fetch the default client config from the back-end

		this.dataService.fetchClientConfig().subscribe(
		results => {
			// This code is invoked if/when the observable is resolved successfully
			this.dBInputs.MongoDBBaseURI = results.mongodb.defaultUri;
			this.dBInputs.MongoDBDatabaseName = results.mongodb.defaultDatabase;
			this.MongoDBCollectionName = results.mongodb.defaultCollection;
			this.defaultMockarooURI = results.mockarooUrl;
			// Store the calculated MongoDB URI both in this object and the
			// dataService sub-object.
			this.dBURI = this.dataService.calculateMongoDBURI(this.dBInputs);
		},
		error => {
			// This code is executed if/when the observable throws an error.
			console.log("Failed to fetch client content data. Reason: " + error.toString);
		});
	}

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

	// This is invoked when the sub-component (SampleComponent from
	// sample.component.ts) emits an onSample event. The binding is created
	// in app.component.html
	onSample(haveSampleData: boolean) {
		// Expose the UpdateComponent
		this.DataToPlayWith = haveSampleData;
	}

	// This is invoked when a sub-component emits an onCollection event to indicate
	// that the user has changes the collection within its form. The binding is 
	// created in app.component.html
	onCollection(CollName: string) {
		this.MongoDBCollectionName = CollName;
	}
}
