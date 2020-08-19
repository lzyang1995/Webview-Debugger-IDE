import { app, BrowserWindow, Menu } from 'electron';
import { getIconForFile } from 'vscode-icons-js';
import menu from './menu';
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const TEST_WIN_WEBPACK_ENTRY: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export declare const WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export declare const PROTOCOL_CONFIG_WEBPACK_ENTRY: any;
// console.log(MAIN_WINDOW_WEBPACK_ENTRY);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

/**
 * Constants
 */

export const WEBVIEW_CONFIG_FILE_PATH = path.join(app.getPath("documents"), 'webview_config.json');
export const PROTOCOL_CONFIG_FILE_PATH = path.join(app.getPath("documents"), 'protocol_config.json');

/** */
const fileIconPath = path.join(app.getPath("documents"), 'vscode_file_icons');

app.allowRendererProcessReuse = false;

let mainWindow: Electron.BrowserWindow = null;
let configWin: Electron.BrowserWindow = null;
// let protocolConfigFileWatcher: any = null;
// let webviewMenuConfigFileWatcher: any = null;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      devTools: !app.isPackaged,
      // webSecurity: false
    },
    frame: false,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  console.log("webcontents id:",mainWindow.webContents.id);

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

function createTestWindow() {
  // Create the browser window.
  let testWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true
    },
  });

  // and load the index.html of the app.
  testWindow.loadURL(TEST_WIN_WEBPACK_ENTRY);

  testWindow.once('ready-to-show', () => {
    testWindow.maximize();
    testWindow.focus();
  })

  testWindow.on('closed', () => {
    testWindow = null;
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // createTestWindow();
  Menu.setApplicationMenu(menu);
  createWindow();

  fs.watchFile(PROTOCOL_CONFIG_FILE_PATH, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      const config = JSON.parse(fs.readFileSync(PROTOCOL_CONFIG_FILE_PATH).toString());
      mainWindow.webContents.send('protocol-config-changed', config);
    }
  });

  fs.watchFile(WEBVIEW_CONFIG_FILE_PATH, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      const config = JSON.parse(fs.readFileSync(WEBVIEW_CONFIG_FILE_PATH).toString());
      mainWindow.webContents.send('webview-menu-config-changed', config);
    }
  })
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

// console.log(WEBVIEW_CONFIG_FILE_PATH);

/**
 * Functions
 */

export function createConfigWindow(title: string, entry: any): void {
  configWin = new BrowserWindow({
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: !app.isPackaged,
    },
    // parent: mainWindow,
    // modal: true,
    // title: title,
  })

  configWin.removeMenu();

  configWin.loadURL(entry);

  if (!app.isPackaged) {
    configWin.webContents.openDevTools();
  }

  configWin.once('ready-to-show', () => {
    configWin.show();
  });

  configWin.on('closed', () => {
    configWin = null;
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

function getFileIcon(filename: string): string {
  const svgFile = getIconForFile(filename);
  return fs.readFileSync(path.join(fileIconPath, svgFile)).toString();
}

export function getDirContent(dirPath: string): Array<any> {
  const resultFile = [];
  const resultDir = [];
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const item: any = {
      title: file,
      key: filePath,
    }

    if (fs.lstatSync(filePath).isDirectory()) {
      resultDir.push(item);
    } else {
      item.icon = getFileIcon(file);
      item.isLeaf = true;
      resultFile.push(item);
    }
  }

  fs.watchFile(dirPath, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      const result = getDirContent(dirPath);
      mainWindow.webContents.send('directory-refresh', dirPath, result);
    }
  });

  return resultDir.concat(resultFile);
}

// export function getFileTree(rootPath: string): Array<any> {
//   const resultFile = [];
//   const resultDir = [];
//   const files = fs.readdirSync(rootPath);
//   for (const file of files) {
//     const filePath = path.join(rootPath, file);
//     const item: any = {
//       title: file,
//       key: filePath,
//     }

//     if (fs.lstatSync(filePath).isDirectory()) {
//       item.children = getFileTree(filePath);
//       resultDir.push(item);
//     } else {
//       item.icon = getFileIcon(file);
//       resultFile.push(item);
//     }
//   }

//   return resultDir.concat(resultFile);
// }

export function readAndWatchRegularFile(fullpath: string): string {
  const result = fs.readFileSync(fullpath).toString();

  fs.watchFile(fullpath, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      const content = fs.readFileSync(fullpath).toString();
      mainWindow.webContents.send('editor-file-changed', fullpath, content);
    }
  })

  return result;
}

export function saveRegularFile(fullpath: string, content: string, stopWatch: boolean): void {
  if (stopWatch) {
    fs.unwatchFile(fullpath);
  }

  fs.writeFileSync(fullpath, content);
}

// export { spawn };

// console.log(getFileTree("E:/cmb_project/coding-75"));