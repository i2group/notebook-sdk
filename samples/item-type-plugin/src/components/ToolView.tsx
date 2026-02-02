import React, { useState } from 'react';

import * as sdk from '@i2analyze/notebook-sdk';
import { useToolViewApi } from '../hooks/useToolViewApi';

import exampleData from '../data/example_data.json';
import { IEntity, IExampleData, ILink } from '../Types';

import './ToolView.css';

function parseData<T>(value: string): T | null {
  try {
    const parsedData = JSON.parse(value);
    return parsedData;
  } catch (error) {
    return null;
  }
}

function findItemTypeByName(
  itemTypes: sdk.data.IKeyedReadOnlyCollection<
    sdk.schema.ChartItemTypeId,
    sdk.schema.IChartItemType
  >,
  name: string
): sdk.schema.IChartItemType | undefined {
  return itemTypes.find((itemType) => itemType.displayName === name);
}

function isLinkData(item: unknown): item is ILink {
  return (item as ILink).fromId !== undefined && (item as ILink).toId !== undefined;
}

export const ToolView = () => {
  const toolViewApi = useToolViewApi();

  const [textAreaValue, setTextAreaValue] = useState(JSON.stringify(exampleData, null, 2));

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(event.target.value);
  };

  const handleAddToChart = () => {
    const parsedData = parseData<IExampleData>(textAreaValue);
    if (!parsedData) {
      toolViewApi.runUntrackedMutations(() => {
        return {
          type: 'rollback',
          report: {
            type: 'error',
            title: 'Failed to parse data',
            details: 'The provided data is not valid JSON.',
          },
        };
      });

      return;
    }

    // Add entity types and link types to the chart
    addItemTypes(parsedData.data);
    // Once the item types are added, add records to the chart
    addRecords(parsedData.data);
  };

  const addItemTypes = (items: (IEntity | ILink)[]) => {
    toolViewApi.runTrackedMutations((application, mutations) => {
      // Filter items whose types are not already in the schema
      const filteredItems = items.filter((item) => {
        const foundItemType = findItemTypeByName(application.chart.schema.itemTypes, item.name);
        return !foundItemType;
      });

      if (filteredItems.length === 0) {
        return { type: 'rollback' };
      }

      for (const item of filteredItems) {
        if (isLinkData(item)) {
          mutations.addLinkType({
            displayName: item.name,
            propertyTypes: item.properties.map((property) => ({
              displayName: property.name,
              logicalType: property.type,
              isLabelPart: true,
            })),
          });
        } else {
          mutations.addEntityType({
            displayName: item.name,
            icon: item.icon,
            propertyTypes: item.properties.map((property) => ({
              displayName: property.name,
              logicalType: property.type,
              isLabelPart: true,
            })),
          });
        }
      }

      return {
        type: 'commit',
        actionDisplayName: 'Add item types',
      };
    });
  };

  const addRecords = (items: (IEntity | ILink)[]) => {
    toolViewApi.runTrackedMutations((application, mutations) => {
      const pendingRecordMap = new Map<string, sdk.app.IPendingRecord>();

      for (const item of items) {
        const itemType = findItemTypeByName(application.chart.schema.itemTypes, item.name);

        if (!itemType) {
          return {
            type: 'rollback',
            report: {
              type: 'error',
              title: 'Failed to add records',
              details: `Item type "${item.name}" not found in schema.`,
            },
          };
        }

        // Create properties for the record
        const properties: [sdk.schema.PropertyTypeSpecifier, sdk.data.PropertyValue][] = [];
        item.properties.forEach((property) => {
          const propertyType = itemType.propertyTypes.find(
            (pt) => pt.displayName === property.name
          );
          if (propertyType) {
            let value: sdk.data.PropertyValue = property.value;

            // If the property type is a date, convert the value to a LocalDate
            if (propertyType.logicalType === 'date') {
              const date = new Date(property.value);
              value = mutations.valueFactory.createLocalDate(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
              );
            }

            properties.push([propertyType, value]);
          }
        });

        // Create a link record
        if (isLinkData(item)) {
          const fromEndRecord = pendingRecordMap.get(item.fromId);
          const toEndRecord = pendingRecordMap.get(item.toId);

          if (!fromEndRecord || !toEndRecord) {
            return {
              type: 'rollback',
              report: {
                type: 'error',
                title: 'Failed to add records',
                details: 'Link record references missing entity records.',
              },
            };
          }

          mutations.addLinkRecord({
            itemType,
            fromEnd: fromEndRecord.recordId,
            toEnd: toEndRecord.recordId,
            linkDirection: 'none',
            properties,
          });
        } else {
          // Create an entity record
          const pendingEntityRecord = mutations.addEntityRecord({
            itemType,
            properties,
          });

          // Store the pending entity record in the map for link record creation
          pendingRecordMap.set(item.shipmentId, pendingEntityRecord);
        }
      }

      return {
        type: 'commit',
        actionDisplayName: 'Add records',
      };
    });
  };

  return (
    <div className="tool-view-container">
      <textarea value={textAreaValue} onChange={handleChange} />
      <button onClick={handleAddToChart}>Add to chart</button>
    </div>
  );
};
