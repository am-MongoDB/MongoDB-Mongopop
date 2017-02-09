import { Component, OnInit, Injectable, EventEmitter, Input, Output} from '@angular/core';
import { Response } from '@angular/http';
import {Observable, Subscription} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import {DataService}	from './data.service';

// This component will be loaded into the <my-add> element of `app/app.component.html`

@Component({
    selector: 'my-update',
    templateUrl: 'app/update.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class UpdateComponent implements OnInit { 

	JSONError: string = "";
	UpdateDocResult: string = "";

	// Parameters sent down from the parent component (AppComponent)
	@Input() dataService: DataService;
	@Input() MongoDBCollectionName: string;

	// Event emitters to pass changes back up to the parent component
	@Output() onCollection = new EventEmitter<string>();

	ngOnInit() {
		}

	// Invoked from the component's html code
	updateDocs(collName: string, matchPattern: string, dataChange: string, threads: number) {

		this.UpdateDocResult = "";
		this.JSONError = "";

		this.dataService.updateDBDocs(collName, matchPattern, dataChange, threads)
		.subscribe(
				data => {
					// Invoked if/when the observable is succesfully resolved
					if (data.success) {
						this.UpdateDocResult = "Updates completed; updated " + data.count.toLocaleString() + " documents";
						this.MongoDBCollectionName = collName;
						this.onCollection.emit(this.MongoDBCollectionName);
					} else {
						this.JSONError = "Application Error: " + data.error;
						this.UpdateDocResult = ""
					}
				},
				error => {
					// Invoked if/when the observable throws an error
					this.JSONError = "Network Error: " + error.toString;
					this.UpdateDocResult = ""
				},
				() => {console.log("Empty Results");}
			)
	}
}
