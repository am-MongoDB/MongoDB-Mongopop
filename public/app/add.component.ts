import { Component, OnInit, Injectable, EventEmitter, Input, Output} from '@angular/core';
import { Response } from '@angular/http';
import {Observable, Subscription} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import {DataService}	from './data.service';

// This component will be loaded into the <my-add> element of `app/app.component.html`

@Component({
    selector: 'my-add',
    templateUrl: 'app/add.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class AddComponent implements OnInit { 

	AddDocError: string = "";
	AddDocResult: string = "";
	docsToAdd: number = 1;

	// Parameters sent down from the parent component (AppComponent)
	@Input() dataService: DataService;
	@Input() MongoDBCollectionName: string;
	@Input() MockarooURL: string;

	// Event emitters to pass changes back up to the parent component
	@Output() onCollection = new EventEmitter<string>();

	ngOnInit() {
		}

	// Invoked from the component's html code
	addDocs(CollName: string, DocURL: string, DocCount: number, Unique: boolean) {
		this.AddDocResult = "";
		this.AddDocError = "";

		this.dataService.sendAddDoc(CollName, DocURL, DocCount, Unique)
		.subscribe(
			results => {
				// Invoked if/when the observable is succesfully resolved
				if (results.success) {
					this.AddDocResult = 'Addded ' + results.count + ',000 documents';
					this.MongoDBCollectionName = CollName;
					// Let the parent component know that the collection name
					// has been changed.
					this.onCollection.emit(this.MongoDBCollectionName);
				} else {
					this.AddDocError = 'Application Error: ' + results.error;
				}
			},
			error => {
				// Invoked if/when the observable throws an error
				this.AddDocError = "Network Error: " + error.toString;
			}
		);
	}
}
