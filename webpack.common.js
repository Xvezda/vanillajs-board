const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    clean: true,
  },
  plugins: [new HtmlWebpackPlugin()]
};
