import { Component, OnInit, Injectable, EventEmitter, Input, Output} from '@angular/core';
import { Response } from '@angular/http';
import { Observable, Subscription }	from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import {DataService} from './data.service';

// This component will be loaded into the <my-count> element of `app/app.component.html`

@Component({
    selector: 'my-count',
    templateUrl: 'app/count.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class CountComponent implements OnInit { 

	CountDocError: string = "";
	DocumentCount: string = "";

	// Parameters sent down from the parent component (AppComponent)
	@Input() dataService: DataService;
	@Input() MongoDBCollectionName: string;

	// Event emitters to pass changes back up to the parent component
	@Output() onCollection = new EventEmitter<string>();

	ngOnInit() {
		}

	// Invoked from the component's html code
	countDocs(CollName: string) {
		this.DocumentCount = "";
		this.CountDocError = "";

		this.dataService.sendCountDocs(CollName)
		.subscribe(
			results => {
			// Invoked if/when the observable is succesfully resolved
			if (results.success) {
				this.DocumentCount = "Collection '" + CollName 
					+ "' contains " + results.count.toLocaleString() + " documents";
				this.MongoDBCollectionName = CollName;
				this.onCollection.emit(this.MongoDBCollectionName);
			}
			else {
				// Invoked if/when the back-end sucessfully sends a response
				// but that response indicates an application-level error
				this.CountDocError = "Application Error: " + results.error;
			}
		},
		error => {
			// Invoked if/when the observable throws an error
			this.CountDocError = "Network Error: " + error;
		})
	}
}
