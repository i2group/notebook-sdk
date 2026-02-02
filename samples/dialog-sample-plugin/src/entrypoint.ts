import { NotebookStatic } from '@i2analyze/notebook-sdk';
import type * as sdk from '@i2analyze/notebook-sdk';
import commandSvg from './assets/plugin-command.svg';

declare const notebook: NotebookStatic;

type DialogResult = [sdk.schema.AnalyzePropertyTypeId, sdk.data.PropertyValue][] | undefined;
type PropertyMap = { [propertyTypeId: number]: sdk.data.PropertyValue };

interface IInitialValueItem {
  type: sdk.schema.IChartPropertyType;
  value: sdk.data.PropertyValue;
}
export type InitialValue = IInitialValueItem[] | undefined;

// This code sample demonstrates how to use the showDialog API by working with Person item types.
// The following definitions are the entity and property type IDs derived from the schema.
const personEntityTypeId = 'ET5';
const firstNamePropertyTypeId = 'PER4';
const familyNamePropertyTypeId = 'PER6';

async function main() {
  const api = await notebook.getEntryPointApi('dff93a38-4e4d-49f7-a4f0-3dc27060ed10', '1.8');

  // Create a command for adding a person record.
  const addRecord = api.commands.createCommand({
    id: '71914723-479a-4c72-a635-dc7e8231b302',
    name: 'Add Person',
    type: 'unscoped',
    icon: { type: 'inlineSvg', svg: commandSvg },
    async onExecute() {
      // When the command is executed, use the API to launch the dialog and
      // provide the config. The config includes the dialog's name, path, size,
      // initialValue and actions.

      // For this dialog, we will use two buttons: cancel and submit.
      // We obtain these actions from the system actions and include them in the
      // config. Note that the 'initialValue' property is optional, and we don't
      // need it for this command.
      const result: DialogResult = await api.showDialog({
        name: 'Add Person',
        path: './dialog.html',
        size: 'small',
        actions: [
          api.systemActions.cancel,
          // To ensure that all input fields are filled before submitting, we'll
          // disable the submit button in the initial state.
          {
            id: api.systemActions.submit,
            enabled: false,
          },
        ],
      });

      // If the user cancels the dialog, there won't be a result.
      // Just return without further action.
      if (!result) {
        return;
      }

      // Run a mutation that creates a person record based on the result provided
      // by the user during the dialog interaction.
      api.runTrackedMutations((application, mutations) => {
        const personItemType = application.chart.schema.getItemType(personEntityTypeId);

        const properties: PropertyMap = {};
        for (const [analyzePropertyTypeId, value] of result) {
          const propertyType = personItemType.getPropertyType(analyzePropertyTypeId);
          properties[propertyType.id] = value;
        }

        const newRecord = mutations.addEntityRecord({ itemType: personItemType, properties });
        mutations.selection.set(newRecord);

        return { type: 'commit', actionDisplayName: 'Add record' };
      });
    },
  });

  // Create a command for editing a person record.
  const editRecord = api.commands.createCommand({
    id: '71df6cd6-37ac-4435-98eb-9d96ec268503',
    name: 'Edit Person',
    type: 'application',
    icon: { type: 'inlineSvg', svg: commandSvg },
    async onExecute() {
      // When modifying an existing record, we want the dialog to display the
      // current first name and family name of the selected record, we will need
      // to include the 'initialValue' in the config for this command.

      // To retrieve these values, use the runTransaction method to read the
      // record data and extract the relevant property values, then assign to
      // the initialValue.
      let initialValue: InitialValue;
      await api.runTransaction((applicationContents) => {
        const record = applicationContents.chart.selection.entityRecords.firstOrDefault(undefined);
        if (record) {
          const properties: IInitialValueItem[] = [];
          for (const id of [firstNamePropertyTypeId, familyNamePropertyTypeId]) {
            const propertyType = record?.itemType.getPropertyType(id);

            if (propertyType) {
              const propertyValue = record.getProperty(propertyType);
              if (propertyValue !== undefined && !record.isValueUnfetched(propertyValue)) {
                properties.push({ type: propertyType, value: propertyValue });
              }
            }
          }

          initialValue = properties;
        }
      });

      // Having prepared the initialValue, we can now launch the dialog and
      // provide the necessary config to display the correct information.
      const result: DialogResult = await api.showDialog({
        name: 'Edit Person',
        path: './dialog.html',
        size: 'small',
        initialValue,
        actions: [api.systemActions.cancel, api.systemActions.submit],
      });

      // If the user cancels the dialog, there won't be a result.
      // Just return without further action.
      if (!result) {
        return;
      }

      // Run a mutation that edits a person record based on the result provided
      // by the user during the dialog interaction.
      api.runTrackedMutations((application, mutations) => {
        const record = application.chart.selection.entityRecords.firstOrDefault(undefined);
        if (!record) {
          return { type: 'rollback' };
        }

        const personItemType = application.chart.schema.getItemType(personEntityTypeId);

        const properties: PropertyMap = {};
        for (const [analyzePropertyTypeId, value] of result) {
          const propertyType = personItemType.getPropertyType(analyzePropertyTypeId);
          properties[propertyType.id] = value;
        }

        mutations.editRecord(record).setProperties(properties);

        return { type: 'commit', actionDisplayName: 'Edit record' };
      });
    },
    onSurface(action, eventApi) {
      // To ensure the command is only enabled when a suitable record is
      // selected, set up a 'chartselectionchange' event listener. The command
      // should be activated only when a single record is selected, the selected
      // record is not from an information store, and the record is of the 'Person'
      // type.
      eventApi.addEventListener(
        'chartselectionchange',
        (selection) => {
          const singleEntityRecordSelected = selection.entityRecords.size === 1;

          const entityRecord = selection.entityRecords.firstOrDefault(undefined);
          const isPerson = entityRecord?.itemType.analyzeId === personEntityTypeId;
          const isInfoStore = entityRecord?.isInfoStore;
          action.setEnabled(singleEntityRecordSelected && isPerson && !isInfoStore);
        },
        { dispatchNow: true }
      );
    },
  });

  // Surface the 'Add Person' command in the ribbon Home tab.
  api.commands.applicationRibbon.homeTab.surfaceCommands(addRecord);

  // Surface the 'Edit Person' command in the chart item popup menu.
  api.commands.chartItemPopupMenu.surfaceCommands(editRecord);

  api.initializationComplete();
}

main();
