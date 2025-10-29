import { NotebookStatic } from '@i2analyze/notebook-sdk';
import commandSvg from 'assets/plugin-command.svg';

declare const notebook: NotebookStatic;

async function main() {
  const api = await notebook.getEntryPointApi('ac7bcb47-f3d5-45c8-8d41-8ca30cf8ec06', '1.8');

  const toolView = api.createToolView({ name: 'item-type-plugin', path: '.', size: 'medium' });

  const command = api.commands.createToolViewToggleCommand(
    {
      id: 'c0a9efce-45f1-45ab-87b7-de16d50849a7',
      name: 'item-type-plugin tool view',
      icon: {
        type: 'inlineSvg',
        svg: commandSvg,
      },
    },
    toolView
  );

  api.commands.applicationRibbon.homeTab.surfaceCommands(command);

  api.initializationComplete();
}

main();
