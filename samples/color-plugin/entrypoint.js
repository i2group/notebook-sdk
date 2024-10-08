/* global notebook */

const vehicleAnalyzeTypeId = "ET3";
const vehicleColorAnalyzeTypeId = "VEH9";

async function main() {
  const api = await notebook.getEntryPointApi(
    "2dcfa60b-69d8-4f43-9a26-dd61ee323981",
    "1.4"
  );
  api.logger.info("Plug-in running");

  const colorVehicleNodes = api.commands.createCommand({
    id: "00000000-0000-0000-0000-000000000002",
    name: "Set vehicle node colors",
    type: "application",
    icon: {
      type: "inlineSvg",
      svg: '<svg viewBox="0 0 16 16"><rect width="8" height="8" x="4" y="4"/></svg>',
    },
    onExecute(applicationContents) {
      const vehicleItemType =
        applicationContents.chart.schema.getItemType(vehicleAnalyzeTypeId);

      const allEntityRecords = applicationContents.chart.entityRecords;

      const vehicleRecords = allEntityRecords.filter(
        (record) => record.itemType === vehicleItemType
      );

      const colorPropertyType = vehicleItemType.getPropertyType(
        vehicleColorAnalyzeTypeId
      );

      api.runTrackedMutations((_, mutations) => {
        for (const vehicleRecord of vehicleRecords) {
          const vehicleColor = vehicleRecord.getProperty(colorPropertyType);

          const vehicleElement = vehicleRecord.element;

          mutations
            .editNode(vehicleElement.id)
            .setColor(vehicleColor?.toString());
        }

        return {
          type: "commit",
          actionDisplayName: "Set Vehicle node colors",
        };
      });
    },
  });

  const homeTab = api.commands.applicationRibbon.homeTab;
  const searchInfoStoreCommand = homeTab.systemGroups.searchInfoStore;

  homeTab.after(searchInfoStoreCommand).surfaceCommands(colorVehicleNodes);

  api.initializationComplete();
}

void main();
