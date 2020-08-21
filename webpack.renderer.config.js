const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

const CopyPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
// const CircularDependencyPlugin = require('circular-dependency-plugin')

// const darkTheme = require('@ant-design/dark-theme');
// import darkTheme from '@ant-design/dark-theme'

// console.log(darkTheme.default);

// rules.push({
//   test: /\.css$/,
//   exclude: MONACO_DIR,
//   use: [
//     { loader: 'style-loader' },
//     {
//       loader: 'css-loader',
//       options: {
//         modules: true,
//         namedExport: true,
//       }
//     }
//   ],
// });

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
})

rules.push({
  test: /\.(png|jpe?g|gif)$/i,
  use: [{ loader: 'file-loader' }],
});

// https://github.com/electron-userland/electron-forge/issues/1196
rules.push({
  test: /\.ttf$/,
  use: [{ loader: 'file-loader' }],
});

// rules.push({
//   test: /\.less$/,
//   use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'less-loader' }],
// });

plugins.push(new CopyPlugin({
  patterns: [
    { from: './src/assets/resources', to: '../resources' },
  ],
}));

plugins.push(new MonacoWebpackPlugin());

// plugins.push(new CircularDependencyPlugin());

// rules.push({
//   test:  /\.less$/,
//   use: [
//     {
//       loader: 'style-loader'
//     },
//     {
//       loader: 'css-loader'
//     },
//     {
//       loader: 'less-loader',
//       options: {
//         lessOptions: {
//           modifyVars: darkTheme.default,
//           javascriptEnabled: true,
//         }
//       }
//     }
//   ],
// });

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
