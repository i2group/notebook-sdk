This directory contains sample files for the [mutation plug-in tutorial](https://i2group.github.io/notebook-sdk/guide/tutorials/mutation-plugin.html).

Clone the repository or download these files to get started.

## Starting the plug-in in development mode

1. Run

   ```
   npm install
   ```

   to install the dependencies.

1. Run

   ```
   npm run dev
   ```

   to start the webpack development server and the plug-in proxy.

1. Edit `devproxy.json` so that it uses your deployment of i2 Analyze.

1. Navigate to `http://localhost:4000/opal/` to see the basic plug-in running inside the i2 Notebook web client.
