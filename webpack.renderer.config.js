const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

const CopyPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin')

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

rules.push({
  test: /\.ttf$/,
  use: [{ loader: 'file-loader' }],
});

rules.push({
  test: /\.less$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'less-loader' }],
});

plugins.push(new CopyPlugin({
  patterns: [
    { from: './node_modules/node-pty', to: './test_win/node_modules/node-pty' },
  ],
}));

plugins.push(new MonacoWebpackPlugin({
  features: [!'codelens']
}));

plugins.push(new CircularDependencyPlugin());

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
  externals: {
    'node-pty': 'commonjs node-pty',
  },
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  },
};
