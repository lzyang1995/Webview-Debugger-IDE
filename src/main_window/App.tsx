import React from 'react';
import Split from 'react-split';
import { remote, WebviewTag } from 'electron';

import { WEBVIEW_BODY_ID, Emulator } from './Emulator';
import { getElementStyle, getGutterStyle } from "../functions";
import '../assets/css/main_window/App.css';

const { webContents, BrowserView } = remote;

export interface AppProps {
    win: Electron.BrowserWindow;
}

export interface AppStates {
    emulatorMinWidth: number;
}

export class App extends React.Component<AppProps, AppStates> {

    // for drag debounce
    private lastExecTime: number | null;
    private execInterval: number;

    private devtoolView: Electron.BrowserView;
    private devtoolsPanel: HTMLElement;

    constructor(props: AppProps) {
        super(props);

        this.lastExecTime = null;
        this.execInterval = 10;
        this.devtoolView = new BrowserView();

        this.state = {
            emulatorMinWidth: 500,
        }

        this.handleDrag = this.handleDrag.bind(this);
        this.setEmulatorMinWidth = this.setEmulatorMinWidth.bind(this);
    }

    componentDidMount(): void {
        this.devtoolsPanel = document.getElementById("console-content");
        this.props.win.setBrowserView(this.devtoolView);
        this.updateDevtoolSize();

        const webviewBodyView = document.getElementById(WEBVIEW_BODY_ID) as WebviewTag;

        (webviewBodyView as HTMLElement).addEventListener('dom-ready', () => {
            // webviewBodyView.setUserAgent("Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Mobile Safari/537.36");
            // console.log(webviewBodyView.getZoomFactor())
            // webviewBodyView.setZoomFactor(2);
            webviewBodyView.loadURL("https://m.baidu.com");
            console.log(webviewBodyView.getZoomFactor())

            const webviewBody = webContents.fromId(webviewBodyView.getWebContentsId());
            webviewBody.setDevToolsWebContents(this.devtoolView.webContents);
            webviewBody.openDevTools();
        }, {once: true});
    }

    setEmulatorMinWidth(width: number): void {
        this.setState({
            emulatorMinWidth: width,
        })
    }

    updateDevtoolSize(): void {
        const rect = this.devtoolsPanel.getBoundingClientRect();
        // console.log(rect);
        this.devtoolView.setBounds({
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        });
    }

    handleDrag(): void {
        const now = Date.now();
        if (this.lastExecTime === null || now - this.lastExecTime > this.execInterval) {
            this.updateDevtoolSize();
            this.lastExecTime = now;
        }
    }

    render(): JSX.Element {
        const { emulatorMinWidth } = this.state;

        return (
            <div id="container">
                <div id="head"></div>
                <Split
                    id="body"
                    sizes={[30, 25, 45]}
                    minSize={[emulatorMinWidth, 100, 200]}
                    expandToMin={true}
                    gutterSize={5}
                    gutterAlign="center"
                    snapOffset={0}
                    dragInterval={1}
                    direction="horizontal"
                    cursor="ew-resize"
                    elementStyle={getElementStyle}
                    gutterStyle={getGutterStyle}
                    onDrag={this.handleDrag}
                >
                    <div id="emulator">
                        <Emulator 
                            setEmulatorMinWidth={this.setEmulatorMinWidth}
                        />
                    </div>
                    <div id="file-explorer"></div>
                    <Split
                        id="editor-and-console"
                        sizes={[75, 25]}
                        minSize={[10, 0]}
                        expandToMin={true}
                        gutterSize={5}
                        gutterAlign="center"
                        snapOffset={0}
                        dragInterval={1}
                        direction="vertical"
                        cursor="ns-resize"
                        onDrag={this.handleDrag}
                    >
                        <div id="editor"></div>
                        <div id="console">
                            <div id="console-choice"></div>
                            <div id="console-content"></div>
                        </div>
                    </Split>
                </Split>
            </div>
        );
    }
}

// export function App(props: AppProps): JSX.Element {
//     return (
//         <div id="container">
//             <div id="head"></div>
//             <Split
//                 id="body"
//                 sizes={[30, 25, 45]}
//                 minSize={[500, 100, 200]}
//                 expandToMin={true}
//                 gutterSize={5}
//                 gutterAlign="center"
//                 snapOffset={0}
//                 dragInterval={1}
//                 direction="horizontal"
//                 cursor="ew-resize"
//                 elementStyle={getElementStyle}
//                 gutterStyle={getGutterStyle}
//             >
//                 <div id="emulator">
//                     {props.emulator}
//                 </div>
//                 <div id="file-explorer"></div>
//                 <Split
//                     id="editor-and-console"
//                     sizes={[75, 25]}
//                     minSize={[10, 0]}
//                     expandToMin={true}
//                     gutterSize={5}
//                     gutterAlign="center"
//                     snapOffset={0}
//                     dragInterval={1}
//                     direction="vertical"
//                     cursor="ns-resize"
//                 >
//                     <div id="editor"></div>
//                     <div id="console">
//                         <div id="console-choice"></div>
//                         <div id="console-content">
//                             {props.consoleContent}
//                         </div>
//                     </div>
//                 </Split>
//             </Split>
//         </div>
//     );
// }
