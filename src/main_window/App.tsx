import React from 'react';
import Split from 'react-split';
import { remote, WebviewTag, ipcRenderer } from 'electron';
// eslint-disable-next-line import/no-unresolved
import * as monaco from 'monaco-editor';
// import FileTree from 'react-filetree-electron';
// import fsFileTree from 'fs-file-tree';

import { WEBVIEW_BODY_ID, Emulator } from './Emulator';
import { FileExplorer } from './FileExplorer';
import { EditorHeader } from './EditorHeader';
import { Console } from './Console';
import { MAIN_MODULE } from '../constants';
import { getElementStyle, getGutterStyle } from "../functions";
import '../assets/css/main_window/App.less';

const { webContents } = remote;
const { readAndWatchRegularFile, saveRegularFile, saveAs } = remote.require(MAIN_MODULE);

export interface File {
    name: string;
    fullpath: string;
}

export interface Tab {
    initVal: string;
    position: monaco.IPosition;
    fullpath: string;
    changed: boolean;
    model: monaco.editor.ITextModel;
}

// export interface AppProps {
//     win: Electron.BrowserWindow;
// }

export interface AppStates {
    emulatorMinWidth: number;
    focusedIndex: number;
    tabs: Array<Tab>;
    refreshDevtool: number;
    projectRoot: string;
}

export class App extends React.Component<{}, AppStates> {

    // for drag debounce
    private lastExecTime: number | null;
    private execInterval: number;

    private lastCheckContentTime: number;
    private checkContentInterval: number;

    // private devtoolView: Electron.BrowserView;
    // private devtoolsPanel: HTMLElement;

    private editor: monaco.editor.IStandaloneCodeEditor;

    // private editor: monaco.editor.IStandaloneCodeEditor;
    private consoleRef: React.RefObject<Console>;

    private newFileKey: number;

    constructor(props: {}) {
        super(props);

        this.lastExecTime = null;
        this.execInterval = 10;
        // this.devtoolView = new BrowserView();

        this.lastCheckContentTime = null;
        this.checkContentInterval = 500;

        this.consoleRef = React.createRef();

        this.newFileKey = 1;

        this.state = {
            emulatorMinWidth: 400,
            focusedIndex: -1,
            tabs: [],
            refreshDevtool: Math.random(),
            projectRoot: null,
        }

        this.handleDrag = this.handleDrag.bind(this);
        this.setEmulatorMinWidth = this.setEmulatorMinWidth.bind(this);
        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.updateFocusedIndex = this.updateFocusedIndex.bind(this);
        this.updateFocusedIndexAndTabs = this.updateFocusedIndexAndTabs.bind(this);
    }

    componentDidMount(): void {
        // this.devtoolsPanel = document.getElementById("console-content");

        // const editorDiv = document.getElementById("editor");

        // const emulatorDiv = document.getElementById("emulator");
        // const fileExplorerDiv = document.getElementById("file-explorer");

        // const bodyDiv = document.getElementById("body");
        // const horizontalGutters = bodyDiv.querySelectorAll(".gutter-horizontal");

        // emulatorDiv.append(horizontalGutters[0]);
        // fileExplorerDiv.append(horizontalGutters[1]);

        // editorDiv.append(bodyDiv.querySelector(".gutter-vertical"));

        // this.props.win.setBrowserView(this.devtoolView);

        // const emulatorBrowserView = this.emulatorRef.current.getBrowserView();
        // const emulatorWebcontents = emulatorBrowserView.webContents;

        // emulatorWebcontents.loadURL("https://m.baidu.com");
        // emulatorWebcontents.setDevToolsWebContents(this.consoleRef.current.getBrowserView().webContents);
        // emulatorWebcontents.openDevTools({mode: "detach"});

        const webviewBodyView = document.getElementById(WEBVIEW_BODY_ID) as Electron.WebviewTag;
        (webviewBodyView as HTMLElement).addEventListener('dom-ready', () => {
            // webviewBodyView.setUserAgent("Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Mobile Safari/537.36");
            // console.log(webviewBodyView.getZoomFactor())
            // webviewBodyView.setZoomFactor(2);
            // console.log("webcontentsid:", webviewBodyView.getWebContentsId())
            const webviewBody = webContents.fromId(webviewBodyView.getWebContentsId());
            // try {
            //     webviewBody.debugger.attach('1.2');
            // } catch (err) {
            //     console.log('Debugger attach failed: ', err);
            // }

            // const isDebuggerAttached = webviewBody.debugger.isAttached();
            // console.log('debugger attached? ', isDebuggerAttached)

            // webviewBody.debugger.on('detach', (event, reason) => {
            //     console.log('Debugger detached due to: ', reason)
            // });

            // webviewBody.enableDeviceEmulation({
            //     screenPosition: "mobile",
            //     screenSize: {
            //         width: 568,
            //         height: 320
            //     },
            //     viewPosition: {
            //         x: 0,
            //         y: 0
            //     },
            //     deviceScaleFactor: 0,
            //     viewSize: {
            //         width: 568,
            //         height: 320
            //     },
            //     scale: 1
            // });

            // webviewBody.debugger.sendCommand('Emulation.setEmitTouchEventsForMouse', {
            //     enabled: true,
            //     configuration: "mobile"
            // })

            // webviewBody.debugger.sendCommand('Emulation.setDeviceMetricsOverride', {
            //     width: 480,
            //     height: 600,
            //     deviceScaleFactor: 1,
            //     mobile: true,
            // })

            // (webviewBodyView as HTMLElement).addEventListener("mousedown", () => {
            //     webviewBody.debugger.sendCommand('Emulation.setEmitTouchEventsForMouse', {
            //         enabled: true,
            //     });
            // });

            // (webviewBodyView as HTMLElement).addEventListener("mouseleave", () => {
            //     webviewBody.debugger.sendCommand('Emulation.setEmitTouchEventsForMouse', {
            //         enabled: false,
            //     });
            // });

            webviewBodyView.loadURL("https://m.baidu.com");
            // console.log(webviewBodyView.getZoomFactor())


            webviewBody.setDevToolsWebContents(this.consoleRef.current.getBrowserView().webContents);
            webviewBody.openDevTools();
        }, { once: true });

        // const hammer = document.getElementById("hammer");
        // const mc = new Hammer(hammer);
        // mc.on('pan', function(event) {
        //     console.log('pan');
        //     console.log(event);
        // })

        // this.editor = monaco.editor.create(document.getElementById("editor"), {
        //     value: 'console.log("Hello, world")',
        //     language: 'javascript',
        //     theme: "vs-dark",
        // });

        this.editor = monaco.editor.create(document.getElementById("editorContent"), {
            model: null,
            theme: "vs-dark",
        });

        setTimeout(() => {
            this.updateDevtoolAndEditorSize();
        }, 1000);

        // fsFileTree("E:/cmb_project/weex-ide", (err: any, tree: any): void => {
        //     console.log(tree);
        // })

        ipcRenderer.on("editor-file-changed", (event, fullpath, content) => {
            const { tabs } = this.state;

            const tabInd = tabs.findIndex(item => item.fullpath === fullpath);
            const tab = tabs[tabInd];

            if (!tab.model.isDisposed()) {
                tab.model.dispose();
            }

            const newModel = monaco.editor.createModel(content, null, monaco.Uri.file(fullpath));
            const newTab = Object.assign({}, tab, {
                initVal: content,
                model: newModel,
                changed: false
            });

            const newTabs = [...tabs];
            newTabs.splice(tabInd, 1, newTab);
            
            this.setState({
                tabs: newTabs
            })
        });

        ipcRenderer.on("new-file-saved", (event, newPath, oldPath, content) => {
            const { tabs } = this.state;

            const tabInd = tabs.findIndex(item => item.fullpath === oldPath);
            const tab = tabs[tabInd];

            if (!tab.model.isDisposed()) {
                tab.model.dispose();
            }

            const newModel = monaco.editor.createModel(content, null, monaco.Uri.file(newPath));
            const newTab = Object.assign({}, tab, {
                initVal: content,
                model: newModel,
                changed: false,
                fullpath: newPath
            });

            const newTabs = [...tabs];
            newTabs.splice(tabInd, 1, newTab);

            this.setState({
                tabs: newTabs
            })
        })

        this.editor.onDidChangeModelContent(() => {
            const now = Date.now();
            if (this.lastCheckContentTime === null || now - this.lastCheckContentTime > this.checkContentInterval) {
                const { focusedIndex, tabs } = this.state;

                const newTabs = [...tabs];
                const newTab = Object.assign({}, newTabs[focusedIndex], {
                    changed: this.editor.getValue() !== newTabs[focusedIndex].initVal
                });
                newTabs.splice(focusedIndex, 1, newTab);

                this.setState({
                    tabs: newTabs
                })

                this.lastCheckContentTime = now;
            }
        });

        this.editor.onDidChangeCursorPosition((event: monaco.editor.ICursorPositionChangedEvent) => {
            const { focusedIndex, tabs } = this.state;

            const newTabs = [...tabs];
            const newTab = Object.assign({}, newTabs[focusedIndex], {
                position: event.position
            });
            newTabs.splice(focusedIndex, 1, newTab);

            this.setState({
                tabs: newTabs
            });
        });

        ipcRenderer.on("save-file", (event): void => {
            const { focusedIndex, tabs } = this.state;
            const tab = tabs[focusedIndex];
            saveRegularFile(tab.fullpath, this.editor.getValue(), false);
        });

        ipcRenderer.on("save-as", (event) => {
            const { focusedIndex, tabs } = this.state;
            const tab = tabs[focusedIndex];
            saveAs(tab.fullpath, this.editor.getValue());
        })

        ipcRenderer.on("new-file", (event) => {
            const { tabs, focusedIndex } = this.state;
            const newTabs = [...tabs];
            
            const newModel = monaco.editor.createModel("");

            newTabs.splice(focusedIndex + 1, 0, {
                initVal: "",
                position: {
                    column: 1,
                    lineNumber: 1
                },
                fullpath: String(this.newFileKey),
                changed: false,
                model: newModel
            });

            this.newFileKey++;

            this.setState({
                tabs: newTabs,
                focusedIndex: focusedIndex + 1,
            });
        });

        ipcRenderer.on("file-opened", (event, fullpath, content) => {
            const { tabs, focusedIndex } = this.state;
            const newTabs = [...tabs];
            
            const newModel = monaco.editor.createModel(content, null, monaco.Uri.file(fullpath));

            newTabs.splice(focusedIndex + 1, 0, {
                initVal: content,
                position: {
                    column: 1,
                    lineNumber: 1
                },
                fullpath: fullpath,
                changed: false,
                model: newModel
            });

            this.setState({
                tabs: newTabs,
                focusedIndex: focusedIndex + 1,
            });
        })
    }

    setEmulatorMinWidth(width: number): void {
        this.setState({
            emulatorMinWidth: width,
        }, () => {
            this.updateDevtoolAndEditorSize();
        });
    }

    updateDevtoolAndEditorSize(): void {
        // const devtoolsrRect = this.devtoolsPanel.getBoundingClientRect();
        // console.log(rect);
        // console.log(rect);
        // this.devtoolView.setBounds({
        //     x: Math.round(devtoolsrRect.x),
        //     y: Math.round(devtoolsrRect.y),
        //     width: Math.round(devtoolsrRect.width),
        //     height: Math.round(devtoolsrRect.height)
        // });
        this.setState({
            refreshDevtool: Math.random(),
        })

        this.consoleRef.current.fitTerminal();
        this.editor.layout();
    }

    handleDrag(): void {
        const now = Date.now();
        if (this.lastExecTime === null || now - this.lastExecTime > this.execInterval) {
            this.updateDevtoolAndEditorSize();
            this.lastExecTime = now;
        }
    }

    handleFileSelect(seletedFile: File): void {
        const { tabs } = this.state;
        const ind = tabs.findIndex(item => item.fullpath === seletedFile.fullpath);

        if (ind === -1) {
            const fileContent = readAndWatchRegularFile(seletedFile.fullpath);
            const model = monaco.editor.createModel(fileContent, null, monaco.Uri.file(seletedFile.fullpath));
            const newTabs = [...tabs, {
                initVal: fileContent,
                position: {
                    column: 1,
                    lineNumber: 1,
                },
                fullpath: seletedFile.fullpath,
                model: model,
                changed: false
            }];
            this.setState({
                focusedIndex: newTabs.length - 1,
                tabs: newTabs
            });
        } else {
            this.updateFocusedIndex(ind);
        }
    }

    updateFocusedIndexAndTabs(focusedIndex: number, tabs: Array<Tab>): void {
        this.setState({
            focusedIndex,
            tabs
        }, () => {
            const { focusedIndex, tabs } = this.state;

            if (tabs.length > 0) {
                this.editor.focus();
                this.editor.revealPositionInCenter(tabs[focusedIndex].position);
                this.editor.setPosition(tabs[focusedIndex].position);
            }
        });
    }

    updateFocusedIndex(ind: number): void {
        this.setState({
            focusedIndex: ind,
        }, () => {
            const { focusedIndex, tabs } = this.state;
            this.editor.focus();
            this.editor.revealPositionInCenter(tabs[focusedIndex].position);
            this.editor.setPosition(tabs[focusedIndex].position);
        });
    }

    render(): JSX.Element {
        const { emulatorMinWidth, focusedIndex, tabs, refreshDevtool, projectRoot } = this.state;

        if (focusedIndex !== -1) {
            this.editor.setModel(tabs[focusedIndex].model);
        }

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
                    <FileExplorer
                        rootPath={projectRoot}
                        handleFileSelect={this.handleFileSelect}
                    />
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
                        <div id="editor">
                            <EditorHeader
                                focusedIndex={focusedIndex}
                                tabs={tabs}
                                updateFocusedIndex={this.updateFocusedIndex}
                                updateFocusedIndexAndTabs={this.updateFocusedIndexAndTabs}
                            />
                            <div id="editorContent"></div>
                        </div>
                        <Console ref={this.consoleRef} refreshDevtool={refreshDevtool} />
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
