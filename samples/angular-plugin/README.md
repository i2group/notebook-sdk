This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.1.3.

This directory contains sample files for the [Angular plug-in tutorial](https://i2group.github.io/notebook-sdk/guide/tutorials/angular-plugin.html).

Clone the repository or download these files to get started.

## Starting the plug-in in development mode

1. Run

   ```
   npm install
   ```

   to install the dependencies.

1. Run

   ```
   npm start
   ```

   to serve the plug-in at `http://localhost:4200/`.

1. Edit `devproxy.json` so that it uses your deployment of i2 Analyze.

1. Run the proxy server using

   ```
   npx @i2analyze/notebook-sdk-plugin-proxy --config devproxy.json
   ```

1. Navigate to `http://localhost:4000/opal/` to see the Angular plug-in running inside the i2 Notebook web client.
