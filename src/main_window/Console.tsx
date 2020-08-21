import React from 'react';
import { remote } from 'electron';
import BrowserView from 'react-electron-browser-view';
import { ConsoleHeader } from './ConsoleHeader';

import os from 'os';
import { IPty, spawn } from 'node-pty';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import '../assets/css/main_window/Console.css';
import 'xterm/css/xterm.css';

export interface ConsoleProps {
    refreshDevtool: number;
}

export class Console extends React.Component<ConsoleProps, {}> {

    private webviewRef: Electron.WebviewTag;
    private ptyProcess: IPty;
    private xterm: Terminal;
    private fitAddon: FitAddon;

    constructor(props: ConsoleProps) {
        super(props);

        const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
        this.ptyProcess = spawn(shell, [], {
            name: 'xterm-color',
            cwd: process.cwd(),
            env: process.env,
        });

        this.fitAddon = new FitAddon();
        this.xterm = null;

        this.handleTabChange = this.handleTabChange.bind(this);
    }

    getWebview(): Electron.WebviewTag {
        return this.webviewRef;
    }

    getBrowserView(): Electron.BrowserView {
        return (this.webviewRef as any).view;
    }

    handleTabChange(key: number): void {
        const win = remote.getCurrentWindow();
        if (key === 0) {
            win.addBrowserView(this.getBrowserView());
        } else {
            win.removeBrowserView(this.getBrowserView());
        }
    }

    componentDidMount(): void {
        const consoleContent = document.querySelector(".consoleContent") as HTMLElement;

        this.xterm = new Terminal();
        this.xterm.loadAddon(this.fitAddon);
        this.xterm.open(consoleContent);
        this.fitAddon.fit();
        // Setup communication between xterm.js and node-pty
        this.xterm.onData(data => this.ptyProcess.write(data));
        this.ptyProcess.on('data', (data: any) => {
            this.xterm.write(data);
        });
    }

    fitTerminal(): void {
        this.fitAddon.fit();
    }

    render(): JSX.Element {
        return (
            <div>
                <ConsoleHeader 
                    defaultInd={0} 
                    tabNames={["DevTool", "Terminal"]} 
                    handleTabChange={this.handleTabChange}
                />
                <BrowserView
                    className="consoleContent"
                    ref={(webview: Electron.WebviewTag): void => { this.webviewRef = webview }}
                    style={{
                        width: "100%",
                        height: "100%"
                    }}
                    update={this.props.refreshDevtool}
                />
            </div>
        );
    }
}