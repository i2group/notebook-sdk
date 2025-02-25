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
