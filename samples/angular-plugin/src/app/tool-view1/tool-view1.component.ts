import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ToolViewApiService } from '../tool-view-api.service';
import type { chart, data, records, toolview } from '@i2analyze/notebook-sdk';

/**
 * Represents a displayable property value with its label.
 */
interface IProperty {
  label: string;
  value: string;
}

@Component({
  selector: 'app-tool-view1',
  templateUrl: './tool-view1.component.html',
  styleUrls: ['./tool-view1.component.css'],
})
export class ToolView1Component implements OnInit {
  /**
   * The i2 Notebook tool view API.
   */
  private readonly toolViewApi: toolview.IToolViewApi;

  /**
   * The label of the current record.
   */
  public recordLabel = '';

  /**
   * The displayable properties of the current record.
   */
  public properties: IProperty[] = [];

  /**
   * The URL for a 360 View of the current record, if such a view exists.
   */
  public threeSixtyUrl?: string;

  /**
   * An image for the current record.
   */
  public image?: data.IImage;

  /**
   * Which of the records being handled by the plug-in should currently be displayed.
   */
  public currentRecordIndex = 0;

  /**
   * The total number of records being handled by the plug-in. This corresponds
   * to the records in the chart selection.
   */
  public totalRecords = 0;

  constructor(service: ToolViewApiService, private readonly changeDetectorRef: ChangeDetectorRef) {
    this.toolViewApi = service.getApi();
  }

  /**
   * Handles clicks of the 'previous' button.
   */
  public onPreviousButtonClick = () => {
    this.currentRecordIndex--;
    this.readDataForCurrentRecord();
  };

  /**
   * Handles clicks of the 'next' button.
   */
  public onNextButtonClick = () => {
    this.currentRecordIndex++;
    this.readDataForCurrentRecord();
  };

  /**
   * Indicates whether the 'previous' button should be disabled.
   */
  public get disablePreviousButton(): boolean {
    return this.currentRecordIndex === 0;
  }

  /**
   * Indicates whether the 'next' button should be disabled.
   */
  public get disableNextButton(): boolean {
    return this.currentRecordIndex === this.totalRecords - 1;
  }

  /**
   * The displayable value of the current index.
   */
  public get currentRecord(): number {
    return this.currentRecordIndex + 1;
  }

  /**
   * The title to display in the navigation header of the plug-in.
   */
  public get navigationTitle() {
    const formatter = this.toolViewApi.formatter;

    if (this.totalRecords === 0) {
      return formatter.wrapForBidi('No records selected.', 'raw');
    }

    const currentRecord = formatter.formatValue(this.currentRecord);
    const totalRecords = formatter.formatValue(this.totalRecords);

    return formatter.wrapForBidi(`Record ${currentRecord} of ${totalRecords}`, 'raw');
  }

  /**
   * Handles changes to the i2 Notebook chart selection.
   */
  private handleChartSelectionChange: chart.SelectionListener = (selection) => {
    this.currentRecordIndex = 0;

    this.readDataForCurrentRecord();
  };

  /**
   * Fetches and processes the data for the current record.
   */
  private readDataForCurrentRecord() {
    this.toolViewApi.runTransaction(async (application) => {
      const records = application.chart.selection.records;
      const recordIds = Array.from(records.map((r) => r.id));
      this.totalRecords = records.size;

      const currentRecordId = recordIds[this.currentRecordIndex];
      const record = records.get(currentRecordId);

      if (record) {
        const propertyTypes = record.itemType.propertyTypes;

        await application.chart.ensurePropertiesFetched(record, propertyTypes);
      }

      this.setValuesForRecord(record);
    });
  }

  /**
   * Configures the displayable values of this component based on a record
   * (or an absence of a record).
   */
  private setValuesForRecord(record: records.IChartRecord | undefined) {
    const formatter = this.toolViewApi.formatter;

    if (record) {
      this.recordLabel = formatter.wrapForBidi(record.labelOrFallback, 'raw');
      this.threeSixtyUrl = record.get360ViewUrl();
      this.image = record.image || (record.isEntity() ? record.itemType.image : undefined);

      const properties: IProperty[] = [];
      for (const propertyType of record.itemType.propertyTypes) {
        const label = formatter.wrapForBidi(propertyType.displayName, 'raw');
        const value = record.getProperty(propertyType);

        if (value !== undefined && !record.isValueUnfetched(value)) {
          const formattedValue = formatter.formatValue(value);

          properties.push({
            label,
            value: formatter.wrapForBidi(formattedValue, 'raw'),
          });
        }
      }

      this.properties = properties;
    } else {
      this.recordLabel = '';
      this.threeSixtyUrl = undefined;
      this.image = undefined;

      this.properties = [];
    }

    this.changeDetectorRef.detectChanges();
  }

  /**
   * Run by Angular at component start-up.
   */
  ngOnInit(): void {
    this.toolViewApi.addEventListener(
      'chartselectionchange',
      this.handleChartSelectionChange
      /* Note: this is a rare case where no { dispatchNow: true } option is wanted.
       * here, because we explicitly read the current index at component start-up.
       */
    );

    this.toolViewApi.addEventListener('unload', (isClosing) => {
      if (isClosing) {
        this.toolViewApi.volatileStore.clear();
      } else {
        this.toolViewApi.volatileStore.set('currentRecordIndex', this.currentRecordIndex);
      }
    });

    this.currentRecordIndex = this.toolViewApi.volatileStore.get('currentRecordIndex') || 0;

    this.readDataForCurrentRecord();
  }
}
