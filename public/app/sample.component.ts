import { Component, OnInit, Injectable, EventEmitter, Input, Output} from '@angular/core';
import { Response } from '@angular/http';
import {Observable, Subscription} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import {DataService}	from './data.service';

@Component({
    selector: 'my-sample',
    templateUrl: 'app/sample.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class SampleComponent implements OnInit { 
	SampleDocResult: string = "";
	SampleDocError: string = "";

	@Input() dataService: DataService;
	@Input() MongoDBCollectionName: string;
	@Output() onSample = new EventEmitter<boolean>();
	@Output() onCollection = new EventEmitter<string>();

	ngOnInit() {
		}
	
	syntaxHighlight(jsonObject: Object) {
		var json: string;

		json = JSON.stringify(jsonObject, null, `\t`);
		console.log("Created string " + json);
		return json;
	}

	sampleDocs(CollName: string, NumberDocs: number) {
		this.SampleDocResult = "";
		this.SampleDocError = "";
		this.onSample.emit(false);
		
		this.dataService.sendSampleDoc(CollName, NumberDocs)
		.subscribe(
			results => {
				console.log("Sent SampleDoc request, handling response");
				console.log(JSON.stringify(results));
				if (results.success) {
					this.SampleDocResult = this.syntaxHighlight(results.documents);
					this.MongoDBCollectionName = CollName;
					this.onSample.emit(true);
					this.onCollection.emit(this.MongoDBCollectionName);
				} else {
					this.SampleDocError = "Failed to get sample: " + results.error;
				}
			},
			error => {
				this.SampleDocError = "Sample failed: " + error.toString;
			}
		);
	}
}
