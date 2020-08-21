import React from 'react';
import { Select, message, Menu, Dropdown, Input } from 'antd';
import { PlusCircleOutlined, LeftOutlined, ArrowRightOutlined, RedoOutlined, EllipsisOutlined } from '@ant-design/icons';
import { ipcRenderer, remote } from 'electron';
// import path from 'path';
// import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
// import OverlayScrollbars from 'overlayscrollbars';
import { MAIN_MODULE } from '../constants';

import '../assets/css/main_window/Emulator.css';
import emulatedDevices from '../assets/emulated_devices.json';

// export interface EmulatorProps {}
// export interface EmulatorState {}

const { 
    readProtocolConfig,
    readWebviewMenuConfig,
    createWindow
} = remote.require(MAIN_MODULE);
const { protocol } = remote;
const { Option } = Select;

const scrollbarStyle = `
    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0, 0, 0, 0.5);
    }

    ::-webkit-scrollbar-thumb:active {
        background-color: rgba(0, 0, 0, 0.7);
    }
`;

declare const WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY: any;

export const WEBVIEW_BODY_ID = "webviewBody";

interface WebviewMenuConfigItem {
    name: string;
    callback: string;
    enabled: boolean;
    data: any;
}

export interface EmulatorProps {
    setEmulatorMinWidth: (width: number) => void;
}

export interface EmulatorStates {
    url: string;
    deviceWidth: number;
    deviceHeight: number;
    webviewMenuConfig: Array<WebviewMenuConfigItem>;
}

interface DeviceOption {
    title: string;
    devicePixelRatio: number;
    width: number;
    height: number;
    userAgent: string;
    type: string;
}

enum ProtocolExecStatus {
    Success, PathError, ParamError, CallbackExecError
}

export class Emulator extends React.Component<EmulatorProps, EmulatorStates> {

    private domReady: boolean;
    private webviewBody: Electron.WebviewTag;
    private deviceOptions: Array<DeviceOption>;
    private emulatorPhone: HTMLElement;
    private protocolConfig: object;

    constructor(props: EmulatorProps) {
        super(props);

        this.domReady = false;
        this.deviceOptions = [];
        for (const item of emulatedDevices) {
            if (!item.device["show-by-default"]) continue;

            this.deviceOptions.push({
                title: item.device.title,
                devicePixelRatio: item.device.screen["device-pixel-ratio"],
                width: item.device.screen.vertical.width,
                height: item.device.screen.vertical.height,
                userAgent: item.device["user-agent"],
                type: item.device.type,
            });
        }

        this.state = {
            url: "",
            deviceWidth: this.deviceOptions[0].width,
            deviceHeight: this.deviceOptions[0].height,
            webviewMenuConfig: readWebviewMenuConfig(),
        }

        this.handleUrlChange = this.handleUrlChange.bind(this);
        this.loadUrl = this.loadUrl.bind(this);
        this.reload = this.reload.bind(this);
        this.handleDeviceChange = this.handleDeviceChange.bind(this);
        this.protocolHandler = this.protocolHandler.bind(this);
        this.handleBack = this.handleBack.bind(this);

        this.protocolConfig = readProtocolConfig();
        ipcRenderer.on('protocol-config-changed', (event, config) => {
            this.protocolConfig = config;
        })

        ipcRenderer.on('webview-menu-config-changed', (event, config) => {
            this.setState({
                webviewMenuConfig: config,
            })
        })
    }

    componentDidMount(): void {
        this.emulatorPhone = document.querySelector(".emulatorPhone");

        this.webviewBody = document.getElementById(WEBVIEW_BODY_ID) as Electron.WebviewTag;
        (this.webviewBody as HTMLElement).addEventListener('dom-ready', () => {
            this.domReady = true;
            this.webviewBody.setUserAgent(this.deviceOptions[0].userAgent);
        }, {once: true});

        (this.webviewBody as HTMLElement).addEventListener('dom-ready', () => {
            this.webviewBody.insertCSS(scrollbarStyle);
        });

        protocol.registerStringProtocol("abc", this.protocolHandler);
    }

    handleUrlChange(event: React.FormEvent<HTMLInputElement>): void {
        this.setState({
            url: (event.target as HTMLInputElement).value,
        });
    }

    loadUrl(): void {
        if (!this.domReady) return;

        // console.log("loadurl")
        // this.webviewBody.clearHistory();
        this.webviewBody.loadURL(this.state.url);
    }

    reload(): void {
        if (!this.domReady) return;

        // console.log("reload")
        this.webviewBody.reload();
    }

    handleDeviceChange(value: string): void {
        const selected = this.deviceOptions.find(item => item.title === value);

        if (this.domReady) {
            this.webviewBody.setUserAgent(selected.userAgent);
            this.webviewBody.reload();
        }

        this.setState({
            deviceWidth: selected.width,
            deviceHeight: selected.height,
        }, () => {
            this.props.setEmulatorMinWidth(selected.width + 100);
        })
    }

    protocolHandler(request: any): void {
        const url: string = request.url;
        const config = this.protocolConfig;
        const showProtocolResult = this.showProtocolResult.bind(this, url);

        const schemeLen = 6;

        const paths = url.slice(schemeLen).split("/"); // length of "abc://" is 10
        const lastPath = paths.pop();
        const indQuestionMark = lastPath.indexOf("?");
        let params: Array<string> = [];

        if (indQuestionMark === -1) {
            paths.push(lastPath);
        } else {
            paths.push(lastPath.slice(0, indQuestionMark));
            const paramString = lastPath.slice(indQuestionMark + 1);
            params = paramString.split("&");
        }

        const map = new Map(); // name value pair for parameters
        for (const item of params) {
            const tmp = item.split("=");
            if (tmp.length < 2) {
                tmp.push(null);
            }

            map.set(tmp[0], tmp[1]);
        }

        let cur: any = config;
        let ind = 0;
        while (!cur.isLeaf) {
            let found = false;
            for (const item of cur.descendants) {
                if (item.name === paths[ind]) {
                    found = true;
                    cur = item;
                    ind++;
                    break;
                }
            }

            if (!found) {
                showProtocolResult(ProtocolExecStatus.PathError, "Incorrect path segment: " + paths[ind]);
                return;
            } else if (ind >= paths.length) {
                break;
            }
        }


        if (!cur.isLeaf) {
            showProtocolResult(ProtocolExecStatus.PathError, "The path does not exist. Maybe some segments are missing at the end?");
            return;
        } else if (ind < paths.length) {
            showProtocolResult(ProtocolExecStatus.PathError, "The path does not exist. Maybe some redundant segments are added at the end?");
            return;
        }


        // Path is correct
        // cur points to the ConfigLeaf now
        const configParams: Array<any> = cur.params;
        if (map.size > configParams.length) {
            showProtocolResult(ProtocolExecStatus.ParamError, "Too many parameters");
            return;
        } else if (map.size < configParams.length) {
            showProtocolResult(ProtocolExecStatus.ParamError, "Some parameters are missing");
            return;
        } else {
            let callbackItem = null;
            for (const item of configParams) {
                if (!map.has(item.name)) {
                    showProtocolResult(ProtocolExecStatus.ParamError, "Missing parameter: " + item.name);
                    return;
                } else if (item.name === "callback") {
                    callbackItem = item;
                    const val = decodeURIComponent(map.get(item.name));
                    if (!val.startsWith("javascript:")) {
                        showProtocolResult(ProtocolExecStatus.ParamError, "The value of callback parameter should start with 'javascript:'");
                        return;
                    }
                }
            }

            if (callbackItem !== null) {
                // try to execute the callback
                if (!this.domReady) {
                    showProtocolResult(ProtocolExecStatus.CallbackExecError, "The emulator is not DOM-Ready. Please try again later.");
                    return;
                } else {
                    const callbackFuncName = decodeURIComponent(map.get("callback")).slice(11);
                    this.webviewBody.executeJavaScript(callbackFuncName + "('" + JSON.stringify(callbackItem.data) + "')")
                        .then(() => {
                            for (const item of configParams) {
                                if (item.name === "callback") continue;

                                this.handleReaction(item.reaction, decodeURIComponent(map.get(item.name)));
                            }

                            showProtocolResult(ProtocolExecStatus.Success, cur.successMsg);
                        })
                        .catch(error => {
                            showProtocolResult(ProtocolExecStatus.CallbackExecError, error.message);
                        })
                }
            } else {
                for (const item of configParams) {
                    if (item.name === "callback") continue;

                    this.handleReaction(item.reaction, decodeURIComponent(map.get(item.name)));
                }

                showProtocolResult(ProtocolExecStatus.Success, cur.successMsg);
            }
        }
    }

    handleReaction(reaction: string, val: string): void {
        const emulatorPhone = this.emulatorPhone;
        const webviewTitle = emulatorPhone.querySelector(".webviewTitle");
        switch (reaction) {
            case "SET_TITLE":
                webviewTitle.textContent = val;
                break;
            default: // NONE
                break;
        }
    }

    showProtocolResult(url: string, status: ProtocolExecStatus, msg: string): void {
        let msgToShow = "";
        if (status !== ProtocolExecStatus.Success) {
            if (url) {
                msgToShow += ("Protocol " + url + " execution fails.\n");
            }
            msgToShow += msg;
            message.error({
                content: msgToShow,
                className: "message",
            });
        } else {
            message.success({
                content: msg,
                className: "message",
            });
        }
    }

    handleBack(): void {
        if (!this.domReady) return;

        this.webviewBody.goBack();
    }

    render(): JSX.Element {
        // console.log(path.resolve(__static));

        const { webviewMenuConfig, deviceWidth, deviceHeight } = this.state;
        const tmp = webviewMenuConfig ? webviewMenuConfig.filter(item => item.enabled) : [];
        const tmp2 = tmp.map(item => {
            const handleClick = () => {
                this.webviewBody.executeJavaScript(item.callback + "('" + JSON.stringify(item.data) + "')")
                    .then(() => {
                        this.showProtocolResult("", ProtocolExecStatus.Success, item.name + ": Callback " + item.callback + " executes successfully");
                    })
                    .catch(error => {
                        this.showProtocolResult("", ProtocolExecStatus.CallbackExecError, item.name + ": Callback " + item.callback + " fails. " + error.message);
                    })
            }

            return (
                <Menu.Item key={item.name} onClick={handleClick}>
                    {item.name}
                </Menu.Item>
            );
        });

        tmp2.push((
            <Menu.Item 
                key="$" 
                onClick={() => createWindow("Webview菜单配置", WEBVIEW_MENU_CONFIG_WEBPACK_ENTRY)}
                style={{textAlign: "center"}}
            >
                <PlusCircleOutlined />
            </Menu.Item>
        ));

        const webviewMenu = (
            <Menu>
                {tmp2}
            </Menu>
        );

        return (
            <div className="emulatorContainer">
                <div className="emulatorToolbar">
                    <Select
                        defaultValue={this.deviceOptions[0].title}
                        style={{ width: 120 }}
                        onChange={this.handleDeviceChange}
                    >
                        {
                            this.deviceOptions.map(item => (
                                <Option value={item.title} key={item.title}>
                                    {item.title}
                                </Option>
                            ))
                        }
                    </Select>
                </div>
                <div className="emulatorPhone">
                    <div className="phone" style={{ width: deviceWidth, height: deviceHeight}}>
                        <div className="webviewHeader">
                            <div className="backButton" onClick={this.handleBack}>
                                <LeftOutlined style={{fontSize: 28, color: "black"}} />
                            </div>
                            <div className="webviewTitle"></div>
                            <Dropdown overlay={webviewMenu} trigger={['click']} placement="bottomRight">
                                <div className="webviewMenu">
                                    <EllipsisOutlined style={{fontSize: 28, color: "black"}} />
                                </div>
                            </Dropdown>
                        </div>
                        <webview id={WEBVIEW_BODY_ID} src="about:blank"></webview>
                        {/* preload={`file:///E:cmb_project/project/trail1/my-new-app/.webpack/renderer/main_window/preload.js`} */}
                    </div>
                </div>
                <div className="emulatorAddressbar">
                    <Input type="text" value={this.state.url} onChange={this.handleUrlChange} />
                    <div className="loadUrl" onClick={this.loadUrl}><ArrowRightOutlined style={{fontSize: 18}} /></div>
                    <div className="reload" onClick={this.reload}><RedoOutlined style={{fontSize: 18}} /></div>
                </div>
            </div>
        );
    }
}