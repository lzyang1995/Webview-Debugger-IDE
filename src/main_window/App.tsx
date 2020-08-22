import React from 'react';
import Split from 'react-split';
import { remote, WebviewTag, ipcRenderer } from 'electron';
// eslint-disable-next-line import/no-unresolved
import * as monaco from 'monaco-editor';
import cloneDeep from 'lodash.clonedeep';
import InlineSVG from 'svg-inline-react';
import path from 'path';

import { WEBVIEW_BODY_ID, Emulator } from './Emulator';
import { FileExplorer } from './FileExplorer';
import { EditorHeader } from './EditorHeader';
import { Console } from './Console';
import { MAIN_MODULE } from '../constants';
import { getElementStyle, getGutterStyle } from "../functions";
import '../assets/css/main_window/App.css';

const { webContents } = remote;
const { readAndWatchRegularFile, saveRegularFile, saveAs, getDirContent } = remote.require(MAIN_MODULE);

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

export interface AppStates {
    emulatorMinWidth: number;
    focusedIndex: number;
    tabs: Array<Tab>;
    refreshDevtool: number;
    fileExplorerTree: Array<any>;
    projectRootPath: string;
}

export class App extends React.Component<{}, AppStates> {

    // for drag debounce
    private lastExecTime: number | null;
    private execInterval: number;

    private lastCheckContentTime: number;
    private checkContentInterval: number;

    private editor: monaco.editor.IStandaloneCodeEditor;

    private consoleRef: React.RefObject<Console>;

    private newFileKey: number;
    private projectRootPath: string;

    constructor(props: {}) {
        super(props);

        this.lastExecTime = null;
        this.execInterval = 10;

        this.lastCheckContentTime = null;
        this.checkContentInterval = 500;

        this.consoleRef = React.createRef();

        this.newFileKey = 1;
        this.projectRootPath = null;

        this.state = {
            emulatorMinWidth: 400,
            focusedIndex: -1,
            tabs: [],
            refreshDevtool: Math.random(),
            fileExplorerTree: null,
            projectRootPath: null,
        }

        this.handleDrag = this.handleDrag.bind(this);
        this.setEmulatorMinWidth = this.setEmulatorMinWidth.bind(this);
        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.updateFocusedIndex = this.updateFocusedIndex.bind(this);
        this.updateFocusedIndexAndTabs = this.updateFocusedIndexAndTabs.bind(this);
        this.onLoadFileExplorerTreeData = this.onLoadFileExplorerTreeData.bind(this);
    }

    componentDidMount(): void {
        const webviewBodyView = document.getElementById(WEBVIEW_BODY_ID) as Electron.WebviewTag;
        (webviewBodyView as HTMLElement).addEventListener('dom-ready', () => {
            const webviewBody = webContents.fromId(webviewBodyView.getWebContentsId());

            /**
             * Emulation.setEmitTouchEventsForMouse is buggy with webview.
             * The whole application is set to touch mode when enable Emulation.setEmitTouchEventsForMouse.
             */
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

            webviewBodyView.loadURL("https://m.baidu.com/");

            webviewBody.setDevToolsWebContents(this.consoleRef.current.getBrowserView().webContents);
            webviewBody.openDevTools();
        }, { once: true });

        this.editor = monaco.editor.create(document.getElementById("editorContent"), {
            model: null,
            theme: "vs-dark",
        });

        setTimeout(() => {
            this.updateDevtoolAndEditorSize();
        }, 1000);

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
            }, () => {
                const { focusedIndex, tabs } = this.state;

                if (tabs.length > 0) {
                    this.editor.focus();
                    this.editor.revealPositionInCenter(tabs[focusedIndex].position);
                    this.editor.setPosition(tabs[focusedIndex].position);
                }
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

        ipcRenderer.on("open-project", (event, projectRootPath) => {
            this.projectRootPath = projectRootPath;
            // we want to change the icon property of treeData items from string to
            // corresponding JSX Element. However, it seems that we can not change
            // the object returned from methods of main process. Otherwise, the program 
            // cannot start up. So we have to make a clone of it.
            const treeData = cloneDeep(getDirContent(projectRootPath));
            this.strToElement(treeData);
            this.setState({
                fileExplorerTree: treeData,
                projectRootPath,
            })
        });

        ipcRenderer.on("close-project", (event) => {
            for (const tab of this.state.tabs) {
                if (tab.model && !tab.model.isDisposed()) {
                    tab.model.dispose();
                }
            }

            this.setState({
                focusedIndex: -1,
                tabs: [],
                fileExplorerTree: null,
                projectRootPath: null,
            });
        })

        ipcRenderer.on("directory-refresh", (event, dirPath, result) => {
            const { fileExplorerTree } = this.state;
            let newTreeData = cloneDeep(fileExplorerTree);
            const resultClone = cloneDeep(result);
            this.strToElement(resultClone);

            let oldContent;
            const newContent = resultClone as Array<any>;
            const node = this.findNodeByKey(newTreeData, dirPath);
            if (dirPath === this.projectRootPath) {
                oldContent = newTreeData;
            } else {
                oldContent = node.children;
            }

            const oldContentMap = new Map();
            for (const item of oldContent) {
                oldContentMap.set(item.key, item);
            }

            for (let i = 0; i < newContent.length; i++) {
                const key = newContent[i].key;
                if (oldContentMap.has(key)) {
                    newContent[i] = oldContentMap.get(key);
                }
            }

            if (dirPath === this.projectRootPath) {
                newTreeData = newContent;
            } else {
                node.children = newContent;
            }

            this.setState({
                fileExplorerTree: newTreeData,
            })
        });

        // ipcRenderer.on("check-unsaved-files", event => {
        //     const { tabs } = this.state;
        //     for (const tab of tabs) {
        //         if (tab.changed) {
        //             ipcRenderer.send("has-unsaved", true);
        //         }
        //     }

        //     ipcRenderer.send("has-unsaved", false);
        // })
    }

    onLoadFileExplorerTreeData(node: any): Promise<any> {
        return new Promise((resolve) => {
            if (node.children) {
                console.log(node);
                resolve();
                return;
            }

            const childrenResult = cloneDeep(getDirContent(node.key));
            this.strToElement(childrenResult);

            const newTreeData = cloneDeep(this.state.fileExplorerTree);
            const newNode = this.findNodeByKey(newTreeData, node.key);

            newNode.children = childrenResult;
            this.setState({
                fileExplorerTree: newTreeData,
            });
            resolve();
        })
    }

    findNodeByKey(data: Array<any>, key: string): any {
        if (key === this.projectRootPath) return data;

        const cur = data.find(item => this.isParentPath(item.key, key));

        if (cur.key === key) {
            return cur;
        } else {
            return this.findNodeByKey(cur.children, key);
        }
    }

    isParentPath(parent: string, child: string): boolean {
        const relative = path.relative(parent, child);
        return !relative.startsWith("..") && !path.isAbsolute(relative);
    }

    strToElement(treeData: Array<any>): void {
        for (const item of treeData) {
            if (item.icon) {
                item.icon = <InlineSVG src={item.icon} />;
            }
        }
    }

    setEmulatorMinWidth(width: number): void {
        this.setState({
            emulatorMinWidth: width,
        }, () => {
            this.updateDevtoolAndEditorSize();
        });
    }

    updateDevtoolAndEditorSize(): void {
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
        const { focusedIndex, tabs } = this.state;
        const ind = tabs.findIndex(item => item.fullpath === seletedFile.fullpath);

        if (ind === -1) {
            const fileContent = readAndWatchRegularFile(seletedFile.fullpath);
            const model = monaco.editor.createModel(fileContent, null, monaco.Uri.file(seletedFile.fullpath));

            const newTabs = [...tabs];
            newTabs.splice(focusedIndex + 1, 0, {
                initVal: fileContent,
                position: {
                    column: 1,
                    lineNumber: 1,
                },
                fullpath: seletedFile.fullpath,
                model: model,
                changed: false
            });
            this.setState({
                focusedIndex: focusedIndex + 1,
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
        const { emulatorMinWidth, focusedIndex, tabs, refreshDevtool, fileExplorerTree, projectRootPath } = this.state;

        const projectName = projectRootPath === null ? null : path.basename(projectRootPath);

        if (focusedIndex !== -1) {
            this.editor.setModel(tabs[focusedIndex].model);
        } else if (this.editor) {
            this.editor.setModel(null);
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
                        fileExplorerTree={fileExplorerTree}
                        projectName={projectName}
                        handleFileSelect={this.handleFileSelect}
                        onLoadFileExplorerTreeData={this.onLoadFileExplorerTreeData}
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
                        <Console 
                            ref={this.consoleRef} 
                            refreshDevtool={refreshDevtool} 
                            // projectRootPath={projectRootPath}
                        />
                    </Split>
                </Split>
            </div>
        );
    }
}
