// This is the main Angular2 module for the Mongopop client app. It is bootstrapped
// from `main.js` (built from `main.ts`)

import { NgModule }      	from '@angular/core';
import { BrowserModule } 	from '@angular/platform-browser';
import { HttpModule } 		from '@angular/http';
import { FormsModule }		from '@angular/forms';


// Components making up the Mongopop Angular2 client app
import { AppComponent }		from './app.component';
import { SampleComponent }	from './sample.component';
import { AddComponent }		from './add.component';
import { CountComponent }	from './count.component';
import { UpdateComponent }	from './update.component';

// Service for accessing the Mongopop (Express) server API
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

	// Load the module defined in `app.component.js(ts)`
	bootstrap: [AppComponent]
})

export class AppModule { }
