/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import React from 'react';
import ReactDOM from 'react-dom';
// import { remote } from 'electron';
// import { monaco } from '@monaco-editor/react';
// import path from 'path';
import 'antd/dist/antd.dark.css';
// import 'xterm/css/xterm.css';
// import 'antd/dist/antd.css';
import { removeViews } from 'react-electron-browser-view';
// import 'overlayscrollbars/css/OverlayScrollbars.css';
import { App } from './App';
import { Titlebar, Color, RGBA } from 'custom-electron-titlebar';
// import { ConsoleContent } from './ConsoleContent';
// import './index.css';
import os from 'os';
import pty from 'node-pty';
// import pty from 'node-pty';
// import { Terminal } from 'xterm';

removeViews();


console.log('👋 This message is being logged by "renderer.js", included via webpack');

new Titlebar({
    backgroundColor: new Color(new RGBA(66, 66, 66, 1)),
});

// function uriFromPath(_path: string): string {
//     let pathName = path.resolve(_path).replace(/\\/g, '/');

//     if (pathName.length > 0 && pathName.charAt(0) !== '/') {
//         pathName = `/${pathName}`;
//     }
//     return encodeURI(`file://${pathName}`);
// }

// declare const PROTOCOL_CONFIG_WEBPACK_ENTRY: any;
// console.log(path.join(PROTOCOL_CONFIG_WEBPACK_ENTRY, "../monaco"));
// monaco.config({
//     paths: {
//         // vs: "file:///E:/cmb_project/project/trail1/my-new-app/.webpack/renderer/monaco"
//         // vs: "http://localhost:3000/monaco"
//         // vs: "file:///E:/cmb_project/project/trail1/my-new-app/src/assets/monaco"
//         vs: "file:///E:/cmb_project/project/trail1/my-new-app/node_modules/monaco-editor/min/vs"
//     }
// });
console.log(pty);
const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cwd: process.cwd(),
  env: process.env
});

// const win = remote.getCurrentWindow();

console.log(process.versions);

ReactDOM.render(
    <App />,
    document.getElementById("root")
);

