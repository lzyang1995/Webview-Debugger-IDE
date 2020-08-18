import { Menu, dialog } from 'electron';
import { 
    createConfigWindow, 
} from './index';

declare const WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY: any;
declare const PROTOCOL_CONFIG_WEBPACK_ENTRY: any;

const template: Array<Electron.MenuItemConstructorOptions> = [
    {
        label: 'File',
        submenu: [
            {
                label: "New File",
                accelerator: 'CommandOrControl+N',
            },
            {
                label: 'Open File',
                accelerator: 'CommandOrControl+O',
            },
            {
                label: 'Save File',
                accelerator: 'CommandOrControl+S',
                click(item, focusedWindow): void {
                    if (!focusedWindow) {
                        return dialog.showErrorBox(
                            'Cannot Save or Export',
                            'There is currently no active document to save or export.'
                        );
                    }
                    focusedWindow.webContents.send('save-file');
                },
            },
        ],
    },
    {
        label: "Tools",
        submenu: [
            {
                label: "Protocol Configuration",
                click(): void {
                    createConfigWindow("协议配置", PROTOCOL_CONFIG_WEBPACK_ENTRY);
                }
            },
            {
                label: "Webview Menu Configuration",
                click(): void {
                    createConfigWindow("Webview菜单配置", WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY);
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