This project was generated with [Vite](https://vitejs.dev/) version 4.4.5.

This directory contains sample files for the [React plug-in tutorial](https://i2group.github.io/notebook-sdk/guide/tutorials/react-plugin.html).

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

   to serve the plug-in at `http://localhost:5173/`.

1. Edit `devproxy.json` so that it uses your deployment of i2 Analyze.

1. Run the proxy server using

   ```
   npx @i2analyze/notebook-sdk-plugin-proxy --config devproxy.json
   ```

1. Navigate to `http://localhost:4000/opal/` to see the React plug-in running inside the i2 Notebook web client.