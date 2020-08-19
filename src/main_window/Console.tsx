import React from 'react';
import { Tabs } from 'antd';
import { remote } from 'electron';
import BrowserView from 'react-electron-browser-view';
// import { XTerm } from 'xterm-for-react';
import { ConsoleHeader } from './ConsoleHeader';

import os from 'os';
import { IPty, spawn } from 'node-pty';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import '../assets/css/main_window/Console.css';
import 'xterm/css/xterm.css';

// declare const TERMINAL_WEBPACK_ENTRY: any;

const { TabPane } = Tabs;

export interface ConsoleProps {
    refreshDevtool: number;
}

export class Console extends React.Component<ConsoleProps, {}> {

    private webviewRef: Electron.WebviewTag;
    // private terminalRef: Electron.WebviewTag;
    private ptyProcess: IPty;
    private xterm: Terminal;
    private fitAddon: FitAddon;
    // private xtermRef: React.RefObject<XTerm>
    // private browserView: Electron.BrowserView;

    constructor(props: ConsoleProps) {
        super(props);

        // this.xtermRef = React.createRef();

        // console.log("pty", pty);

        // const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
        // this.ptyProcess = spawn(shell, [], {
        //     name: 'xterm-color',
        //     cwd: process.cwd(),
        //     env: process.env,
        //     cols: 80,
        //     rows: 30,
        // });
        // this.browserView = new BrowserView();
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
            // win.removeBrowserView((this.terminalRef as any).view)
        } else {
            win.removeBrowserView(this.getBrowserView());
            // win.addBrowserView((this.terminalRef as any).view)
            // this.fitTerminal();
            // const terminalContainer = document.querySelector(".terminalContainer") as HTMLElement;
            // console.log(terminalContainer.getBoundingClientRect());
        }
    }

    componentDidMount(): void {
        // this.ptyProcess.on("data", (data: any) => {
        //     this.xtermRef.current.terminal.write(data);
        // })
        const consoleContent = document.querySelector(".consoleContent") as HTMLElement;
        // console.log(terminalContainer.getBoundingClientRect());



        this.xterm = new Terminal();
        // this.fitAddon = new FitAddon();
        this.xterm.loadAddon(this.fitAddon);
        this.xterm.open(consoleContent);
        this.fitAddon.fit();

        // console.log("ptyProcess", this.ptyProcess);
        // console.log("xterm", this.xterm);

        // Setup communication between xterm.js and node-pty
        this.xterm.onData(data => this.ptyProcess.write(data));
        this.ptyProcess.on('data', (data: any) => {
            this.xterm.write(data);
        });
        // console.log(this.terminalRef);
        // this.terminalRef.loadURL(TERMINAL_WEBPACK_ENTRY);
        // this.terminalRef.openDevTools();
    }

    fitTerminal() {
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
            // <Tabs defaultActiveKey="1" onChange={this.handleTabChange}>
            //     <TabPane tab="DevTool" key="1">
            //         <BrowserView
            //             ref={(webview: Electron.WebviewTag): void => { this.webviewRef = webview }}
            //             style={{
            //                 width: "100%",
            //                 height: "100%"
            //             }}
            //             update={this.props.refreshDevtool}
            //         />
            //     </TabPane>
            //     <TabPane tab="Terminal" key="2" forceRender={true}>
            //         {/* <XTerm
            //             ref={this.xtermRef}
            //             onData={(data: string): void => this.ptyProcess.write(data)}
            //         /> */}
            //         <div className="terminalContainer"></div>
            //         {/* <BrowserView
            //             ref={(webview: Electron.WebviewTag): void => { this.terminalRef = webview }}
            //             style={{
            //                 width: "500px",
            //                 height: "500px"
            //             }}
            //             update={this.props.refreshDevtool}
            //             onDidAttach={() => {
            //                 console.log("BrowserView attached");
            //             }}
            //             onUpdateTargetUrl={() => {
            //                 console.log("Updated Target URL");
            //             }}
            //             devtools={true}
            //             webPreferences={{
            //                 nodeIntegration: true
            //             }}
            //         /> */}
            //     </TabPane>
            // </Tabs>
        );
    }
}