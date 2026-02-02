// @ts-check
/* global notebook */
/// <reference types="@i2analyze/notebook-sdk" />

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
    "94f22ca7-6a90-4463-844f-90534aed2a9c",
    "1.4"
  );
  api.logger.info("plug-in running");

  const viewOnMap = api.commands.createCommand({
    id: "1f773294-014e-4709-b717-94eeae2b490a",
    name: "View on map",
    icon: {
      type: "inlineSvg",
      svg: '<svg viewBox="0 0 16 16"><rect width="8" height="8" x="4" y="4"/></svg>',
    },
    type: "records",
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

  const toolView = api.createToolView({ name: "My tool view", path: "./" });
  const toggle = api.commands.createToolViewToggleCommand(
    {
      id: "829a0d65-b695-4675-a335-8abb9a637598",
      name: "Record inspector plug-in",
      icon: {
        type: "inlineSvg",
        svg: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" /></svg>',
      },
      keyboardHelp: {
        category: "discover",
        label: "Toggle record inspector plug-in",
        keys: ["shift+r"],
      },
    },
    toolView
  );
  api.commands.applicationRibbon.homeTab
    .after(viewOnMap.id)
    .surfaceCommands(toggle);

  api.commands.removeCommand(api.commands.systemCommands.toggleRecordInspector);

  api.initializationComplete();
}

void main();
