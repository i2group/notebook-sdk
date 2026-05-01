import { NotebookStatic } from '@i2analyze/notebook-sdk';
import commandSvg from './assets/plugin-command.svg';

declare const notebook: NotebookStatic;

async function main() {
  const api = await notebook.getEntryPointApi('481cbf03-3713-4e3d-a162-1a261dbb28b8', '1.9');

  const colorVehicleNodes = api.commands.createCommand({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Color vehicle nodes',
    type: 'application',
    icon: {
      type: 'inlineSvg',
      svg: commandSvg,
    },
    onExecute(applicationContents) {
      const vehicleItemType = applicationContents.chart.schema.entityTypes.get('Vehicle');

      if (!vehicleItemType) {
        throw new Error('Vehicle item type not found in chart schema');
      }

      const allEntityRecords = applicationContents.chart.entityRecords;

      const vehicleRecords = allEntityRecords.filter(
        (record) => record.itemType === vehicleItemType
      );

      const colorPropertyType = vehicleItemType.propertyTypes.get('Vehicle Color');

      if (!colorPropertyType) {
        throw new Error('Color property type not found for vehicle item type');
      }

      api.runTrackedMutations((_, mutations) => {
        for (const vehicleRecord of vehicleRecords) {
          const vehicleColor = vehicleRecord.getProperty(colorPropertyType);

          const vehicleElement = vehicleRecord.element;
          mutations.editNode(vehicleElement.id).setColor(vehicleColor?.toString());
        }

        return {
          type: 'commit',
          actionDisplayName: 'Set vehicle node colors',
        };
      });
    },
  });

  const homeTab = api.commands.applicationRibbon.homeTab;
  const chartManagementCommand = homeTab.systemGroups.chartManagement;

  homeTab.after(chartManagementCommand).surfaceCommands(colorVehicleNodes);

  api.initializationComplete();
}

main();
