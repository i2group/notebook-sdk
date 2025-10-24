import { Injectable } from '@angular/core';
import { getToolViewApi, toolview } from '@i2analyze/notebook-sdk';

@Injectable({
  providedIn: 'root',
})
export class ToolViewApiService {
  constructor() {}

  private api!: toolview.IToolViewApi;

  /**
   * Initialize the tool view API.
   */
  async init() {
    this.api = await getToolViewApi();
  }

  public getApi() {
    return this.api;
  }
}

export function initializeToolViewApiServiceFactory(service: ToolViewApiService) {
  return () => service.init();
}
