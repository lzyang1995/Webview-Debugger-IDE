import os from 'os';
import { Terminal } from 'xterm';
import { remote } from 'electron';
import { MAIN_MODULE } from '../constants';

import 'xterm/css/xterm.css';

const { spawn } = remote.require(MAIN_MODULE);

// Initialize node-pty with an appropriate shell
const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
const ptyProcess = spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.cwd(),
  env: process.env
});

// Initialize xterm.js and attach it to the DOM
const xterm = new Terminal();
xterm.open(document.getElementById('root'));

// Setup communication between xterm.js and node-pty
xterm.onData(data => ptyProcess.write(data));
ptyProcess.on('data', function (data: any) {
  xterm.write(data);
});