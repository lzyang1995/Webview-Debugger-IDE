import { Menu, dialog, app } from 'electron';
import {
    createWindow,
    openFile,
    closeProject,
    openProject,
} from './index';

declare const WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY: any;
declare const PROTOCOL_CONFIG_WEBPACK_ENTRY: any;
declare const NEW_PROJECT_WEBPACK_ENTRY: any;

const toolMenu: any = {
    label: "Tools",
    submenu: [
        {
            label: "Protocol Configuration",
            click(): void {
                createWindow("Protocol Configuration", PROTOCOL_CONFIG_WEBPACK_ENTRY);
            }
        },
        {
            label: "Webview Menu Configuration",
            click(): void {
                createWindow("Webview Menu Configuration", WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY);
            }
        },
    ]
};

if (!app.isPackaged) {
    toolMenu.submenu.push({
        label: "Toggle Devtools",
        role: "toggleDevTools"
    });
}

const template: Array<Electron.MenuItemConstructorOptions> = [
    {
        label: 'Project',
        submenu: [
            {
                label: 'New Project',
                accelerator: 'CommandOrControl+Shift+N',
                click(): void {
                    createWindow("Create New Project", NEW_PROJECT_WEBPACK_ENTRY);
                }
            },
            {
                label: 'Open Project',
                accelerator: 'CommandOrControl+Shift+O',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Open Project',
                            'The program window is not active'
                        );
                    }
                    openProject();
                },
            },
            {
                label: 'Close Project',
                accelerator: 'CommandOrControl+Shift+W',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Close Project',
                            'The program window is not active'
                        );
                    }
                    closeProject();
                },
            }
        ]
    },
    {
        label: 'File',
        submenu: [
            {
                label: "New File",
                accelerator: 'CommandOrControl+N',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Create New File',
                            'The program window is not active'
                        );
                    }
                    focusedWindow.webContents.send('new-file');
                },
            },
            {
                label: 'Open File',
                accelerator: 'CommandOrControl+O',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Open File',
                            'The program window is not active'
                        );
                    }
                    openFile();
                },
            },
            {
                label: 'Save File',
                accelerator: 'CommandOrControl+S',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Save File',
                            'The program window is not active'
                        );
                    }
                    focusedWindow.webContents.send('save-file');
                },
            },
            {
                label: 'Save As',
                accelerator: 'CommandOrControl+Shift+S',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Save File',
                            'The program window is not active'
                        );
                    }
                    focusedWindow.webContents.send('save-as');
                },
            },
            {
                label: 'Close File',
                accelerator: 'CommandOrControl+W',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Close File',
                            'The program window is not active'
                        );
                    }
                    focusedWindow.webContents.send('close-file');
                },
            }
        ],
    },
    // {
    //     label: 'Edit',
    //     submenu: [
    //         {
    //             label: 'Undo',
    //             accelerator: 'CommandOrControl+Z',
    //             role: 'undo',
    //         },
    //         {
    //             label: 'Redo',
    //             accelerator: 'Shift+CommandOrControl+Z',
    //             role: 'redo',
    //         },
    //         {
    //             label: 'Cut',
    //             accelerator: 'CommandOrControl+X',
    //             role: 'cut',
    //         },
    //         {
    //             label: 'Copy',
    //             accelerator: 'CommandOrControl+C',
    //             role: 'copy',
    //         },
    //         {
    //             label: 'Paste',
    //             accelerator: 'CommandOrControl+V',
    //             role: 'paste',
    //         },
    //         {
    //             label: 'Select All',
    //             accelerator: 'CommandOrControl+A',
    //             role: 'selectAll',
    //         },
    //     ],
    // },
    toolMenu
];

const menu = Menu.buildFromTemplate(template);

export default menu;