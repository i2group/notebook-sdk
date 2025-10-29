const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const packageJson = require('./package.json');

const webpackConfig = (env) => ({
  entry: {
    entrypoint: './src/entrypoint.ts',
    dialog: './src/dialog.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  ...(env.production || !env.development ? { devtool: 'source-map' } : { devtool: 'eval-source-map' }),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/opal/plugins/dialog-sample-plugin',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/opal/plugins/dialog-sample-plugin',
    },
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        include: path.join(__dirname, 'src'),
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.svg$/,
        type: 'asset/source',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PRODUCTION': env.production || !env.development,
      'process.env.NAME': JSON.stringify(packageJson.name),
      'process.env.VERSION': JSON.stringify(packageJson.version),
    }),
    new ForkTsCheckerWebpackPlugin(),
    new ESLintPlugin({ files: './src/**/*.ts' }),
  ],
});

module.exports = webpackConfig;
