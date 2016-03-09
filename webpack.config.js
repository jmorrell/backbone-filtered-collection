var webpack = require('webpack');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'backbone-filtered-collection.js',
    library: 'FilteredCollection',
    libraryTarget: 'umd',
  },
  externals: {
    jquery: 'jQuery',
    underscore: '_',
    backbone: 'Backbone'
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin({
    //  compress: {
    //    warnings: false
    //  }
    //})
  ],
  watch: true
};