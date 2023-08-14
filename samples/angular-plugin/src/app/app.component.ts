import { Component } from '@angular/core';
import { ToolViewApiService } from './tool-view-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  /**
   * Indicates whether the application is running with a dark theme.
   */
  public readonly isDarkTheme: boolean;

  /**
   * The flow direction of the application user interface. `ltr` or `rtl`.
   */
  public readonly flowDirection: string;

  constructor(service: ToolViewApiService) {
    const toolViewApi = service.getApi();

    this.isDarkTheme = toolViewApi.theme.appearance === 'dark';
    this.flowDirection = toolViewApi.locale.flowDirection;
  }
}
