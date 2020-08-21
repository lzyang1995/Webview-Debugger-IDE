const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

const CopyPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
})

rules.push({
  test: /\.(png|jpe?g|gif)$/i,
  use: [{ loader: 'file-loader' }],
});

rules.push({
  test: /\.ttf$/,
  use: [{ loader: 'file-loader' }],
});

plugins.push(new CopyPlugin({
  patterns: [
    { from: './src/assets/resources', to: '../resources' },
  ],
}));

plugins.push(new MonacoWebpackPlugin());

module.exports = {
  // externals: {
  //   'node-pty': 'commonjs node-pty',
  // },
  /**
   * Important: setting the publicPath
   * 
   * It seems that Electron forge emits static files into ./.webpack/renderer directory.
   * This does not cause problem during development, but after packaging
   * the default public path for these static files is the directory of the renderer process,
   * for example, .webpack/renderer/main_window for renderer process named main_window. 
   * So we must set publicPath to "../", otherwise the static files cannot be found after packaging.
   */
  output: {
    publicPath: '../',
  },
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  },
};
