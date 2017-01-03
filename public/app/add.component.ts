import { Component, OnInit, Injectable, EventEmitter, Input, Output} from '@angular/core';
import { Response } from '@angular/http';
import {Observable, Subscription} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import {DataService}	from './data.service';

// Angular2 http requests with Observables

@Component({
    selector: 'my-add',
    templateUrl: 'app/add.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class AddComponent implements OnInit { 

	AddDocError: string = "";
	AddDocResult: string = "";
	MockarooURL: string = "http://www.mockaroo.com/536ecbc0/download?count=1000&key=48da1ee0";
	docsToAdd: number = 1;

	@Input() dataService: DataService;
	@Input() MongoDBCollectionName: string;
	@Output() onCollection = new EventEmitter<string>();

	ngOnInit() {
		}

	addDocs(CollName: string, DocURL: string, DocCount: number, Unique: boolean) {
		this.AddDocResult = "";
		this.AddDocError = "";

		this.dataService.sendAddDoc(CollName, DocURL, DocCount, Unique)
		.subscribe(
			results => {
				console.log("Sent AddDocs request, handling response");
				console.log(JSON.stringify(results));
				console.log("Added " + results.count + " documents");
				if (results.success) {
					this.AddDocResult = 'Addded ' + results.count + ',000 documents';
					this.MongoDBCollectionName = CollName;
					this.onCollection.emit(this.MongoDBCollectionName);
				} else {
					this.AddDocError = 'Error: ' + results.error;
				}
			},
			error => {
				this.AddDocError = "Add failed: " + error.toString;
			}
		);
	}
}
