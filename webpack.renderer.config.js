const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

// const darkTheme = require('@ant-design/dark-theme');
// import darkTheme from '@ant-design/dark-theme'

// console.log(darkTheme.default);

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

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
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  },
};
