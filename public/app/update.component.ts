import { Component, OnInit, Injectable, EventEmitter, Input, Output} from '@angular/core';
import { Response } from '@angular/http';
import {Observable, Subscription} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import {DataService}	from './data.service';

@Component({
    selector: 'my-update',
    templateUrl: 'app/update.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class UpdateComponent implements OnInit { 

	JSONError: string = "";
	UpdateDocResult: string = "";

	@Input() dataService: DataService;
	@Input() MongoDBCollectionName: string;
	@Output() onCollection = new EventEmitter<string>();

	ngOnInit() {
		}

	updateDocs(collName: string, matchPattern: string, dataChange: string, threads: number) {

		this.UpdateDocResult = "";
		this.JSONError = "";

		this.dataService.updateDBDocs(collName, matchPattern, dataChange, threads)
		.subscribe(
				data => {
					if (data.success) {
						this.UpdateDocResult = "Updates completed; updated " + data.count.toLocaleString() + " documents";
						this.MongoDBCollectionName = collName;
						this.onCollection.emit(this.MongoDBCollectionName);
					} else {
						this.JSONError = "Update failed: " + data.error;
						this.UpdateDocResult = ""
					}
				},
				error => {
					this.JSONError = "Update failed: " + error.toString;
					this.UpdateDocResult = ""
				},
				() => {console.log("Empty Results");}
			)
	}
}
