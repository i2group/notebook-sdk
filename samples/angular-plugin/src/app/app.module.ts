import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ToolView1Component } from './tool-view1/tool-view1.component';
import {
  ToolViewApiService,
  initializeToolViewApiServiceFactory,
} from './tool-view-api.service';

@NgModule({
  declarations: [AppComponent, ToolView1Component],
  imports: [BrowserModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeToolViewApiServiceFactory,
      deps: [ToolViewApiService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
