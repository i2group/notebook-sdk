import { useCallback, useEffect, useState } from 'react';
import {
  chart,
  data,
  records,
  schema,
  toolview,
} from '@i2analyze/notebook-sdk';

import { useToolViewApi } from './useToolViewApi';
import './ToolView.css';

interface IProperty {
  id: schema.ChartPropertyTypeId;
  label: string;
  value: data.PropertyValue;
}

export default function ToolView() {
  const toolViewApi = useToolViewApi();
  const themeClass =
    toolViewApi.theme.appearance === 'dark' ? 'dark-theme' : 'light-theme';

  const [recordLabel, setRecordLabel] = useState('');
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [threeSixtyUrl, setThreeSixtyUrl] = useState<string | undefined>();
  const [image, setImage] = useState<data.IImage | undefined>();
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const formatter = toolViewApi.formatter;

  const setValuesForRecord = useCallback(
    (record: records.IChartRecord | undefined) => {
      if (record) {
        setRecordLabel(record.labelOrFallback);
        setThreeSixtyUrl(record.get360ViewUrl());
        setImage(
          record.image ??
            (record.isEntity() ? record.itemType.image : undefined)
        );

        const properties: IProperty[] = [];
        for (const propertyType of record.itemType.propertyTypes) {
          const property = record.getProperty(propertyType);
          if (property !== undefined && !record.isValueUnfetched(property)) {
            properties.push({
              id: propertyType.id,
              label: propertyType.displayName,
              value: property,
            });
          }
        }

        setProperties(properties);
      } else {
        setRecordLabel('');
        setThreeSixtyUrl(undefined);
        setImage(undefined);

        setProperties([]);
      }
    },
    []
  );

  // Navigation buttons simply move the selected index up and down
  const handlePreviousButtonClick = () => {
    setCurrentRecordIndex((r) => r - 1);
  };
  const handleNextButtonClick = () => {
    setCurrentRecordIndex((r) => r + 1);
  };

  const handleChartSelectionChange = useCallback<chart.SelectionListener>(
    (selection) => {
      setCurrentRecordIndex(0);
      setTotalRecords(selection.records.size);

      setValuesForRecord(selection.records.firstOrDefault(undefined));
    },
    [setValuesForRecord]
  );

  useEffect(() => {
    toolViewApi.runTransaction(async (application) => {
      const selection = application.chart.selection;
      const records = Array.from(selection.records);
      setTotalRecords(selection.records.size);
      const record = records[currentRecordIndex];
      if (record) {
        const propertyTypes = record.itemType.propertyTypes;

        await application.chart.ensurePropertiesFetched(record, propertyTypes);
      }
      setValuesForRecord(record);
    });
  }, [toolViewApi, setValuesForRecord, currentRecordIndex]);

  useEffect(() => {
    const unsubscribe = toolViewApi.addEventListener(
      'chartselectionchange',
      handleChartSelectionChange
    );

    const initialIndex =
      toolViewApi.volatileStore.get<number>('currentRecordIndex') || 0;
    setCurrentRecordIndex(initialIndex);

    return unsubscribe;
  }, [handleChartSelectionChange, toolViewApi]);

  const handleUnload = useCallback<toolview.ToolViewUnloadListener>(
    (isClosing) => {
      if (isClosing) {
        toolViewApi.volatileStore.clear();
      } else {
        toolViewApi.volatileStore.set('currentRecordIndex', currentRecordIndex);
      }
    },
    [toolViewApi, currentRecordIndex]
  );

  useEffect(() => {
    return toolViewApi.addEventListener('unload', handleUnload);
  }, [toolViewApi, handleUnload]);

  const navigationTitle = formatter.wrapForBidi(
    totalRecords > 0
      ? `Record ${formatter.formatValue(
          currentRecordIndex + 1
        )} of ${formatter.formatValue(totalRecords)}`
      : 'No records selected.',
    'raw'
  );

  return (
    <div dir={toolViewApi.locale.flowDirection} className={themeClass}>
      <div className="record-navigation">
        <div>{navigationTitle}</div>
        {totalRecords > 0 ? (
          <div className="navigation-buttons">
            <button
              className="navigation-button"
              onClick={handlePreviousButtonClick}
              title="Previous record"
              disabled={currentRecordIndex === 0}
            >
              &lt;
            </button>
            <button
              className="navigation-button"
              onClick={handleNextButtonClick}
              title="Next record"
              disabled={currentRecordIndex === totalRecords - 1}
            >
              &gt;
            </button>
          </div>
        ) : null}
      </div>
      <h1 className="record-header">
        {image ? (
          <img
            className="record-image"
            src={image.href}
            alt={image.description}
          />
        ) : null}
        {threeSixtyUrl ? (
          <a
            className="record-label"
            href={threeSixtyUrl}
            target="_blank"
            rel="noreferrer"
          >
            {formatter.wrapForBidi(recordLabel, 'raw')}
          </a>
        ) : (
          <span className="record-label">
            {formatter.wrapForBidi(recordLabel, 'raw')}
          </span>
        )}
      </h1>
      <div className="record-properties">
        {properties.map((property) => (
          <div key={property.id} className="property">
            <div className="property-label">
              {formatter.wrapForBidi(property.label, 'raw')}
            </div>
            <div className="property-value">
              {formatter.wrapForBidi(
                formatter.formatValue(property.value),
                'raw'
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
