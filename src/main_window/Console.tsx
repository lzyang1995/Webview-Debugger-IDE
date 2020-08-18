import React from 'react';
import { Tabs } from 'antd';
import { remote } from 'electron';
import BrowserView from 'react-electron-browser-view';
// import { XTerm } from 'xterm-for-react';
// import 'xterm/css/xterm.css';
// import os from 'os';
// const pty = window.require('node-pty');
// import { Terminal } from 'xterm';

import '../assets/css/main_window/Console.css';

const { TabPane } = Tabs;

export interface ConsoleProps {
    refreshDevtool: number;
}

export class Console extends React.Component<ConsoleProps, {}> {

    private webviewRef: Electron.WebviewTag;
    // private ptyProcess: any;
    // private xtermRef: React.RefObject<XTerm>
    // private browserView: Electron.BrowserView;

    constructor(props: ConsoleProps) {
        super(props);

        // this.xtermRef = React.createRef();

        // console.log("pty", pty);

        // const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
        // this.ptyProcess = pty.spawn(shell, [], {
        //     name: 'xterm-color',
        //     cwd: process.cwd(),
        //     env: process.env
        // });
        // this.browserView = new BrowserView();

        this.handleTabChange = this.handleTabChange.bind(this);
    }

    getWebview(): Electron.WebviewTag {
        return this.webviewRef;
    }

    getBrowserView(): Electron.BrowserView {
        return (this.webviewRef as any).view;
    }

    handleTabChange(key: string): void {
        const win = remote.getCurrentWindow();
        if (key === "1") {
            win.addBrowserView(this.getBrowserView());
        } else {
            win.removeBrowserView(this.getBrowserView());
        }
    }

    // componentDidMount(): void {
    //     // this.ptyProcess.on("data", (data) => {
    //     //     this.xtermRef.current.terminal.write(data);
    //     // })
    // }

    render(): JSX.Element {
        return (
            <Tabs defaultActiveKey="1" onChange={this.handleTabChange}>
                <TabPane tab="DevTool" key="1">
                    <BrowserView
                        ref={(webview: Electron.WebviewTag): void => { this.webviewRef = webview }}
                        style={{
                            width: "100%",
                            height: "100%"
                        }}
                        update={this.props.refreshDevtool}
                    />
                </TabPane>
                <TabPane tab="Terminal" key="2">
                    {/* <XTerm 
                        ref={this.xtermRef}
                        onData={(data: string): void => this.ptyProcess.write(data)}
                    /> */}
                </TabPane>
            </Tabs>
        );
    }
}