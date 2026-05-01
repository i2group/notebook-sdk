import { TestBed } from '@angular/core/testing';

import { ToolViewApiService } from './tool-view-api.service';

describe('ToolViewApiService', () => {
  let service: ToolViewApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolViewApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
