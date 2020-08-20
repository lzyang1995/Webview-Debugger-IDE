import { Menu, dialog, TouchBarColorPicker } from 'electron';
import { 
    createConfigWindow, 
    openFile
} from './index';

declare const WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY: any;
declare const PROTOCOL_CONFIG_WEBPACK_ENTRY: any;

const template: Array<Electron.MenuItemConstructorOptions> = [
    {
        label: 'Project',
        submenu: [
            {
                label: 'New Project',
                accelerator: 'CommandOrControl+Shift+N',
            },
            {
                label: 'Open Project',
                accelerator: 'CommandOrControl+Shift+O',
            },
            {
                label: 'Close Project',
                accelerator: 'CommandOrControl+Shift+W'
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
    {
        label: "Tools",
        submenu: [
            {
                label: "Protocol Configuration",
                click(): void {
                    createConfigWindow("Protocol Configuration", PROTOCOL_CONFIG_WEBPACK_ENTRY);
                }
            },
            {
                label: "Webview Menu Configuration",
                click(): void {
                    createConfigWindow("Webview Menu Configuration", WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY);
                }
            },
            {
                label: "Toggle Devtools",
                role: "toggleDevTools"
            }
        ]
    },
];

const menu = Menu.buildFromTemplate(template);

export default menu;