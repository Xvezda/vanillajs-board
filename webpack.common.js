const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    clean: true,
  },
  plugins: [new HtmlWebpackPlugin()],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@': path.resolve('src')
    }
  }
};
