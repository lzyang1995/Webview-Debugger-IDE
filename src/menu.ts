import { Menu } from 'electron';
import { createWebviewConfigWindow } from './index';

const template: Array<Electron.MenuItemConstructorOptions> = [
    {
        label: "工具",
        submenu: [
            {
                label: "协议配置",
            },
            {
                label: "Webview菜单配置",
                click(): void {
                    createWebviewConfigWindow();
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