import { NotebookStatic } from '@i2analyze/notebook-sdk';
import commandSvg from './assets/plugin-command.svg';

declare const notebook: NotebookStatic;

const vehicleAnalyzeTypeId = 'ET3';
const vehicleColorAnalyzeTypeId = 'VEH9';

async function main() {
  const api = await notebook.getEntryPointApi('73623dbf-294d-4035-973b-24dc3badaad7', '1.4');

  const colorVehicleNodes = api.commands.createCommand({
    id: '8b697255-7576-43fb-aed0-e3b496931321',
    name: 'Set vehicle node colors',
    icon: {
      type: 'inlineSvg',
      svg: commandSvg,
    },
    type: 'application',
    onExecute(applicationContents) {
      const vehicleItemType = applicationContents.chart.schema.getItemType(vehicleAnalyzeTypeId);

      const allEntityRecords = applicationContents.chart.entityRecords;

      const vehicleRecords = allEntityRecords.filter(
        (record) => record.itemType === vehicleItemType
      );

      const colorPropertyType = vehicleItemType.getPropertyType(vehicleColorAnalyzeTypeId);

      api.runTrackedMutations((_, mutations) => {
        for (const vehicleRecord of vehicleRecords) {
          const vehicleColor = vehicleRecord.getProperty(colorPropertyType);

          const vehicleElement = vehicleRecord.element;

          mutations.editNode(vehicleElement.id).setColor(vehicleColor?.toString());
        }

        return {
          type: 'commit',
          actionDisplayName: 'Set Vehicle node colors',
        };
      });
    },
  });

  const homeTab = api.commands.applicationRibbon.homeTab;
  const searchInfoStoreCommand = homeTab.systemGroups.searchInfoStore;

  homeTab.after(searchInfoStoreCommand).surfaceCommands(colorVehicleNodes);

  api.initializationComplete();
}

main();
