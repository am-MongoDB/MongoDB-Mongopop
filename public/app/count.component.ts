import { Component, OnInit, Injectable, EventEmitter, Input, Output} 	from '@angular/core';
import { Response } 													from '@angular/http';
import { Observable, Subscription } 										from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import {DataService}													from './data.service';

@Component({
    selector: 'my-count',
    templateUrl: 'app/count.component.html',
    styleUrls:  ['stylesheets/style.css']
})

@Injectable()
export class CountComponent implements OnInit { 

	CountDocError: string = "";
	DocumentCount: string = "";

	@Input() dataService: DataService;
	@Input() MongoDBCollectionName: string;
	@Output() onCollection = new EventEmitter<string>();

	ngOnInit() {
		}

	countDocs(CollName: string) {
		this.DocumentCount = "";
		this.CountDocError = "";

		this.dataService.sendCountDocs(CollName)
		.subscribe(results => {
			console.log("Sent CountDocs request, handling response");
			console.log(JSON.stringify(results));
			if (results.success) {
				this.DocumentCount = "Collection '" + CollName 
					+ "' contains " + results.count.toLocaleString() + " documents";
				this.MongoDBCollectionName = CollName;
				this.onCollection.emit(this.MongoDBCollectionName);
			}
			else { 
				this.CountDocError = "Error: " + results.error;
			}
		})
	}
}
