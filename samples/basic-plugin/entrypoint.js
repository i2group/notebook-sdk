/* global notebook */

/**
 * @param {import("@i2analyze/notebook-sdk").data.IReadOnlyCollection<import("@i2analyze/notebook-sdk").records.IChartRecord>} records
 */
function findGeospatialValue(records) {
  for (const record of records) {
    for (const propertyType of record.itemType.propertyTypes) {
      if (propertyType.logicalType === "geospatial") {
        const property = record.getProperty(propertyType);
        if (property !== undefined && !record.isValueUnfetched(property)) {
          return /** @type {import("@i2analyze/notebook-sdk").data.IGeoPoint} */ (
            property
          );
        }
      }
    }
  }

  return undefined;
}

async function main() {
  const api = await notebook.getEntryPointApi(
    "2dcfa60b-69d8-4f43-9a26-dd61ee323981",
    "1.4"
  );
  api.logger.info("Plug-in running");

  const viewOnMap = api.commands.createCommand({
    id: "5d02238c-6331-4630-962c-73d82f46bb23",
    name: "View on map",
    type: "records",
    icon: {
      type: "inlineSvg",
      svg: '<svg viewBox="0 0 16 16"><rect width="8" height="8" x="4" y="4"/></svg>',
    },
    onExecute(payload) {
      const property = findGeospatialValue(payload.records);

      if (!property) {
        return;
      }

      window.open(
        `https://www.google.com/maps/@${property.latitude},${property.longitude},18z`,
        "_blank"
      );
    },
    onSurface(action, eventApi, signal) {
      eventApi.addEventListener(
        "recordscontextchange",
        (context) => {
          action.setEnabled(!!findGeospatialValue(context.records));
        },
        { dispatchNow: true, signal }
      );
    },
  });

  api.commands.applicationRibbon.homeTab
    .after(api.commands.applicationRibbon.homeTab.systemGroups.searchInfoStore)
    .surfaceCommands(viewOnMap);

  api.commands.chartItemPopupMenu.surfaceCommands(viewOnMap);

  api.initializationComplete();
}

void main();
