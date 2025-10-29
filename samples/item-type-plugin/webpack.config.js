const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const packageJson = require('./package.json');

const webpackConfig = (env) => ({
  entry: {
    index: './src/index.tsx',
    entrypoint: './src/entrypoint.ts',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  ...(env.production || !env.development ? { devtool: 'source-map' } : { devtool: 'eval-source-map' }),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/opal/plugins/item-type-plugin',
  },
  devServer: {
    static: {
      publicPath: '/opal/plugins/item-type-plugin',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      excludeChunks: ['entrypoint'],
    }),
    new webpack.DefinePlugin({
      'process.env.PRODUCTION': env.production || !env.development,
      'process.env.NAME': JSON.stringify(packageJson.name),
      'process.env.VERSION': JSON.stringify(packageJson.version),
    }),
    new ForkTsCheckerWebpackPlugin(),
    new ESLintPlugin({ files: './src/**/*.{ts,tsx}' }),
  ],
});

module.exports = webpackConfig;
