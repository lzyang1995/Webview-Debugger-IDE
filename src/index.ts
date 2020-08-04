import { app, BrowserWindow, Menu } from 'electron';
import menu from './menu';
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export declare const WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export declare const PROTOCOL_CONFIG_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow: Electron.BrowserWindow = null;
let webviewConfigWin: Electron.BrowserWindow = null;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.focus();
  })

  mainWindow.on('closed', () => {
    mainWindow = null;
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Menu.setApplicationMenu(menu);
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

/**
 * Constants
 */

export const WEBVIEW_CONFIG_FILE_PATH = path.join(app.getPath("documents"), 'webview_config.json');
export const PROTOCOL_CONFIG_FILE_PATH = path.join(app.getPath("documents"), 'protocol_config.json');

// console.log(WEBVIEW_CONFIG_FILE_PATH);

/**
 * Functions
 */

export function createConfigWindow(title: string, entry: any): void {
  webviewConfigWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
    parent: mainWindow,
    modal: true,
    title: title
  })

  webviewConfigWin.removeMenu();

  webviewConfigWin.loadURL(entry);

  webviewConfigWin.webContents.openDevTools();

  webviewConfigWin.once('ready-to-show', () => {
    webviewConfigWin.show();
  });

  webviewConfigWin.on('closed', () => {
    webviewConfigWin = null;
  })
}

export function readConfigFile(path: string): object {
  if (fs.existsSync(path)) {
    // console.log(JSON.parse(fs.readFileSync(WEBVIEW_CONFIG_FILE_PATH).toString()));
    return JSON.parse(fs.readFileSync(path).toString());
  } else {
    return null;
  }
}

export function writeConfigFile(config: object, path: string): void {
  fs.writeFileSync(path, JSON.stringify(config, null, 4));
}