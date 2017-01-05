import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Invoked from `system.config.js`; loads `app.module.js` (built from `app.module.ts`) and
// then bootstraps the module contained in that file (`AppModule`)

import { AppModule } from './app.module';

platformBrowserDynamic().bootstrapModule(AppModule);
