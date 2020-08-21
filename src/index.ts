import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import { getIconForFile } from 'vscode-icons-js';
import menu from './menu';
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const TEST_WIN_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

/**
 * Constants
 */

const WEBVIEW_MENU_CONFIG_FILE_NAME = "webview_menu_config.json";
const PROTOCOL_CONFIG_FILE_NAME = "protocol_config.json";

/** */
let fileIconPath: string;
if (app.isPackaged) {
  fileIconPath = path.join(path.dirname(app.getPath("exe")), 'resources/app/.webpack/resources/vscode_file_icons')
} else {
  fileIconPath = path.join(__dirname, '../resources/vscode_file_icons');
}

// console.log(__dirname)

app.allowRendererProcessReuse = false;

let mainWindow: Electron.BrowserWindow = null;
let configWin: Electron.BrowserWindow = null;
let webviewMenuConfigFilePath: string = null;
let protocolConfigFilePath: string = null;
// let protocolConfigFileWatcher: any = null;
// let webviewMenuConfigFileWatcher: any = null;
const watchedFiles: Set<string> = new Set();

const createMainWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      // devTools: !app.isPackaged,
      // webSecurity: false
    },
    frame: false,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  console.log("webcontents id:", mainWindow.webContents.id);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.focus();
  })

  mainWindow.on('closed', () => {
    mainWindow = null;
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Menu.setApplicationMenu(menu);
  createMainWindow();
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
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// console.log(WEBVIEW_CONFIG_FILE_PATH);

/**
 * Functions
 */

export function createWindow(title: string, entry: any): void {
  configWin = new BrowserWindow({
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      // devTools: !app.isPackaged,
    },
    parent: mainWindow,
    modal: true,
    title: title,
  })

  configWin.removeMenu();

  configWin.loadURL(entry);

  // if (!app.isPackaged) {
  //   configWin.webContents.openDevTools();
  // }
  configWin.webContents.openDevTools();

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

export function readProtocolConfig(): object {
  return readConfigFile(protocolConfigFilePath);
}

export function readWebviewMenuConfig(): object {
  return readConfigFile(webviewMenuConfigFilePath);
}

export function writeProtocolConfig(config: object): void {
  writeConfigFile(config, protocolConfigFilePath)
}

export function writeWebviewMenuConfig(config: object): void {
  writeConfigFile(config, webviewMenuConfigFilePath);
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
      console.log("dir changed ", dirPath);
      const result = getDirContent(dirPath);
      mainWindow.webContents.send('directory-refresh', dirPath, result);
    }
  });
  watchedFiles.add(dirPath);

  return resultDir.concat(resultFile);
}

export function readAndWatchRegularFile(fullpath: string): string {
  const result = fs.readFileSync(fullpath).toString();

  fs.watchFile(fullpath, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      const content = fs.readFileSync(fullpath).toString();
      mainWindow.webContents.send('editor-file-changed', fullpath, content);
    }
  });
  watchedFiles.add(fullpath);

  return result;
}

export function saveRegularFile(fullpath: string, content: string, stopWatch: boolean): void {
  if (!isNaN(+fullpath)) {
    dialog.showSaveDialog(mainWindow, {
      title: "Save File",
      defaultPath: app.getPath("documents"),
    }).then(result => {
      if (result.canceled) return;

      fs.writeFileSync(result.filePath, content);
      mainWindow.webContents.send('new-file-saved', result.filePath, fullpath, content);
      fs.watchFile(result.filePath, (cur, prev) => {
        if (cur.mtimeMs !== prev.mtimeMs) {
          const content = fs.readFileSync(result.filePath).toString();
          mainWindow.webContents.send('editor-file-changed', result.filePath, content);
        }
      });
      watchedFiles.add(result.filePath);
    })
  } else {
    if (stopWatch) {
      fs.unwatchFile(fullpath);
      watchedFiles.delete(fullpath);
    }

    fs.writeFileSync(fullpath, content);
  }
}

export function saveAs(fullpath: string, content: string): void {
  let defaultPath;
  if (!isNaN(+fullpath)) {
    defaultPath = app.getPath("documents");
  } else {
    defaultPath = fullpath;
  }

  dialog.showSaveDialog(mainWindow, {
    title: "Save As",
    defaultPath,
  }).then(result => {
    if (result.canceled) return;

    fs.writeFileSync(result.filePath, content);
    mainWindow.webContents.send('new-file-saved', result.filePath, fullpath, content);
    fs.watchFile(result.filePath, (cur, prev) => {
      if (cur.mtimeMs !== prev.mtimeMs) {
        const content = fs.readFileSync(result.filePath).toString();
        mainWindow.webContents.send('editor-file-changed', result.filePath, content);
      }
    });
    watchedFiles.add(result.filePath);

    if (isNaN(+fullpath)) {
      fs.unwatchFile(fullpath);
      watchedFiles.delete(fullpath);
    }
  })
}

export function openFile(): void {
  dialog.showOpenDialog(mainWindow, {
    title: "Open File",
    defaultPath: app.getPath("documents"),
    properties: ["openFile"]
  }).then(result => {
    if (result.canceled) return;

    const fullpath = result.filePaths[0];
    const content = fs.readFileSync(fullpath).toString();
    app.addRecentDocument(fullpath);
    mainWindow.webContents.send('file-opened', fullpath, content);
    fs.watchFile(fullpath, (cur, prev) => {
      if (cur.mtimeMs !== prev.mtimeMs) {
        const content = fs.readFileSync(fullpath).toString();
        mainWindow.webContents.send('editor-file-changed', fullpath, content);
      }
    });
    watchedFiles.add(fullpath);
  })
}

export function clearFileWatchers(): void {
  for (const filepath of watchedFiles) {
    fs.unwatchFile(filepath);
  }
  watchedFiles.clear();
}

export function closeProject(): void {
  mainWindow.webContents.send('close-project');
  clearFileWatchers();
}

export function openProject(): void {
  dialog.showOpenDialog(mainWindow, {
    title: 'Open Project',
    defaultPath: app.getPath("documents"),
    properties: ["openDirectory"]
  }).then(result => {
    if (result.canceled) return;

    const projectRoot = result.filePaths[0];

    webviewMenuConfigFilePath = path.join(projectRoot, WEBVIEW_MENU_CONFIG_FILE_NAME);
    protocolConfigFilePath = path.join(projectRoot, PROTOCOL_CONFIG_FILE_NAME);

    if (!fs.existsSync(webviewMenuConfigFilePath) || !fs.existsSync(protocolConfigFilePath)) {
      dialog.showMessageBox(mainWindow, {
        type: "error",
        buttons: ["OK"],
        defaultId: 0,
        title: "Open Project Error",
        message: "The folder does not have protocol configuration file or webview menu configuration file.",
        noLink: true
      });
      webviewMenuConfigFilePath = null;
      protocolConfigFilePath = null;
      return;
    }

    closeProject();

    fs.watchFile(protocolConfigFilePath, (cur, prev) => {
      if (cur.mtimeMs !== prev.mtimeMs) {
        const config = JSON.parse(fs.readFileSync(protocolConfigFilePath).toString());
        mainWindow.webContents.send('protocol-config-changed', config);
      }
    });

    fs.watchFile(webviewMenuConfigFilePath, (cur, prev) => {
      if (cur.mtimeMs !== prev.mtimeMs) {
        const config = JSON.parse(fs.readFileSync(webviewMenuConfigFilePath).toString());
        mainWindow.webContents.send('webview-menu-config-changed', config);
      }
    });

    watchedFiles.add(protocolConfigFilePath);
    watchedFiles.add(webviewMenuConfigFilePath);

    mainWindow.webContents.send("open-project", projectRoot);
  })
}

export function createProject(projectPath: string, protocolFileSource: string, webviewMenuFileSource: string): void {
  fs.mkdirSync(projectPath, { recursive: true });

  if (protocolFileSource === "default") {
    if (app.isPackaged) {
      protocolFileSource = path.join(path.dirname(app.getPath("exe")), 'resources/app/.webpack/resources', PROTOCOL_CONFIG_FILE_NAME);
    } else {
      protocolFileSource = path.join(__dirname, '../resources', PROTOCOL_CONFIG_FILE_NAME);
    }
  }

  if (webviewMenuFileSource === "default") {
    if (app.isPackaged) {
      webviewMenuFileSource = path.join(path.dirname(app.getPath("exe")), 'resources/app/.webpack/resources', WEBVIEW_MENU_CONFIG_FILE_NAME);
    } else {
      webviewMenuFileSource = path.join(__dirname, '../resources', WEBVIEW_MENU_CONFIG_FILE_NAME);
    }
  }

  protocolConfigFilePath = path.join(projectPath, PROTOCOL_CONFIG_FILE_NAME);
  webviewMenuConfigFilePath = path.join(projectPath, WEBVIEW_MENU_CONFIG_FILE_NAME);

  fs.copyFileSync(protocolFileSource, protocolConfigFilePath);
  fs.copyFileSync(webviewMenuFileSource, webviewMenuConfigFilePath);

  closeProject();

  fs.watchFile(protocolConfigFilePath, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      const config = JSON.parse(fs.readFileSync(protocolConfigFilePath).toString());
      mainWindow.webContents.send('protocol-config-changed', config);
    }
  });

  fs.watchFile(webviewMenuConfigFilePath, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      const config = JSON.parse(fs.readFileSync(webviewMenuConfigFilePath).toString());
      mainWindow.webContents.send('webview-menu-config-changed', config);
    }
  });

  watchedFiles.add(protocolConfigFilePath);
  watchedFiles.add(webviewMenuConfigFilePath);

  mainWindow.webContents.send("open-project", projectPath);
}

// resolve: can proceed
// reject: cannot proceed
// async function dealingUnsavedFiles(): Promise<any> {
//   const hasUnsavedFile = await new Promise(resolve => {
//     mainWindow.webContents.send("check-unsaved-files");

//     ipcMain.once("has-unsaved", (event, hasUnsaved) => {
//       resolve(hasUnsaved);
//     })
//   });

//   if (!hasUnsavedFile) {
//     return Promise.resolve();
//   } else {
//     const result = await dialog.showMessageBox(mainWindow, {
//       message: "Your changes will be lost if you don't save them",
//       title: "You have unsaved files",
//       type: "warning",
//       buttons: ["Save All", "Don't save", "Cancel"],
//       defaultId: 0,
//       cancelId: 2,
//       noLink: true
//     });

//     if (result.response === 2) {
//       return Promise.reject();
//     } else if (result.response === 1) {
//       return Promise.resolve();
//     } else {

//     }
//   }
// }