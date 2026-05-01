# Dialog Sample

## About this sample

This sample demonstrates how to use the `showDialog` API to create and display modal dialogs with custom configurations.
The sample shows how to populate dialogs with initial data and handle user-submitted values from dialog forms by creating two commands that use dialogs to manage Person records with first name and family name properties: one for adding new records and another for editing existing records.

### What this sample shows

- **Dialog configuration and launch**: How to configure and launch dialogs using the `showDialog` API with different sizes and actions
- **Initial data handling**: How to populate dialogs with initial data using the `initialValue` property and `getInitialValue()`
- **Data submission**: How to capture and submit form data using `submitAndClose()` and handle cancellation with `close()`
- **Dynamic action**: How to enable/disable dialog actions using `updateAction()` based on form validation
- **Event handling**: How to listen for dialog actions and respond to user interactions

The sample demonstrates two dialog examples:

1. **Add record command**: Shows how to launch a dialog without initial data

   The `addRecord` command in `entrypoint.js` is surfaced in the Home tab. When executed, it calls `showDialog` with a configuration that includes the dialog name, path, size, and actions (cancel and submit). The dialog content is defined in `dialog.html` as a standard HTML form, while `dialog.ts` uses `getDialogApi()` to access dialog methods and sets up event listeners to handle user interactions.

   The dialog demonstrates `updateAction()` to dynamically enable the submit button when both form fields are filled. When the user submits the form, `submitAndClose()` is called with the form data, which resolves the `showDialog` promise. This returned data is then processed to create a new record using mutations.

2. **Edit record command**: Shows how to create a dialog for modifying existing data

   The `editRecord` command is surfaced in the chart item popup menu. It demonstrates where existing data needs to be retrieved and displayed in the dialog. Before launching the dialog, the command uses `runTransaction` to read the currently selected record and extract its property values. These values are formatted and passed as the `initialValue` when calling `showDialog`.

   The dialog content uses `getDialogApi()` to access the dialog API, then calls `getInitialValue()` to retrieve the data and populate the form fields. The dialog also listens for action events - if the user clicks submit, it calls `submitAndClose()` with the form data; if they click cancel or close, it calls `close()`. After the user modifies the data and submits, the returned values are used to update the existing record through mutations.

# Template i2 Notebook plug-in

This is a template project that contains an example of how to include external libraries and bundle them into an output entry-point script.

The project uses the following packages for the build environment:

- Typescript
- Webpack
- ESLint
- Prettier

Use `npm run dev` to start a development process that uses:

- **`webpack-dev-server`** to transpile, bundle, and serve `entrypoint.ts`.

  **Note:** No output is written to the `dist` folder. The webpack configuration includes a linting pass.

- **`@ibmi2/notebook-sdk-plugin-proxy`** to proxy between a running i2 Analyze server and the webpack development server.

- **`cpx`** to copy the `plugin.json` file, plus any other static assets, from the source `public` folder to the output `dist` folder. These files are served by the webpack development server.

Use `npm run build` to generate a production build that uses:

- **`webpack`** to transpile and bundle `entrypoint.ts` into an output `entrypoint.js` file, written to the output `dist` folder.

- **`prettier`** to reformat the source files before compilation.

- **`cpx`** to copy the `plugin.json` file, plus any other static assets, from the source `public` folder to the output `dist` folder.
