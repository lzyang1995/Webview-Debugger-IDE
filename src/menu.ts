import { Menu } from 'electron';
import { 
    createConfigWindow, 
} from './index';

declare const WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY: any;
declare const PROTOCOL_CONFIG_WEBPACK_ENTRY: any;

const template: Array<Electron.MenuItemConstructorOptions> = [
    {
        label: "工具",
        submenu: [
            {
                label: "协议配置",
                click(): void {
                    createConfigWindow("协议配置", PROTOCOL_CONFIG_WEBPACK_ENTRY);
                }
            },
            {
                label: "Webview菜单配置",
                click(): void {
                    createConfigWindow("Webview菜单配置", WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY);
                }
            },
            {
                label: "toggle devtools",
                role: "toggleDevTools"
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);

export default menu;