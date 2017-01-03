import { NgModule }      	from '@angular/core';
import { BrowserModule } 	from '@angular/platform-browser';
import { HttpModule } 		from '@angular/http';
import { FormsModule }		from '@angular/forms';

import { AppComponent }		from './app.component';
import { SampleComponent }	from './sample.component';
import { AddComponent }		from './add.component';
import { CountComponent }	from './count.component';
import { UpdateComponent }	from './update.component';

import { DataService }		from './data.service';

@NgModule({

 	imports: [ 
  		BrowserModule,
		FormsModule, 
		HttpModule
		],

	declarations: [
		AppComponent,
		SampleComponent,
		AddComponent,
		CountComponent,
		UpdateComponent
		],

	providers: [
		DataService
		],

	bootstrap: [AppComponent]
})

export class AppModule { }
