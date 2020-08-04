import React from 'react';
import { Select } from 'antd';
import '../assets/css/main_window/Emulator.css';
import emulatedDevices from '../assets/emulated_devices.json';

// export interface EmulatorProps {}
// export interface EmulatorState {}

const { Option } = Select;

export const WEBVIEW_BODY_ID = "webviewBody";

export interface EmulatorProps {
    setEmulatorMinWidth: (width: number) => void;
}

export interface EmulatorStates {
    url: string;
    deviceWidth: number;
    deviceHeight: number;
}

interface DeviceOption {
    title: string;
    devicePixelRatio: number;
    width: number;
    height: number;
    userAgent: string;
    type: string;
}

export class Emulator extends React.Component<EmulatorProps, EmulatorStates> {

    private domReady: boolean;
    private webviewBody: Electron.WebviewTag;
    private deviceOptions: Array<DeviceOption>

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
        }

        this.handleUrlChange = this.handleUrlChange.bind(this);
        this.loadUrl = this.loadUrl.bind(this);
        this.reload = this.reload.bind(this);
        this.handleDeviceChange = this.handleDeviceChange.bind(this);
    }

    componentDidMount(): void {
        this.webviewBody = document.getElementById(WEBVIEW_BODY_ID) as Electron.WebviewTag;
        (this.webviewBody as HTMLElement).addEventListener('dom-ready', () => {
            this.domReady = true;
            this.webviewBody.setUserAgent(this.deviceOptions[0].userAgent);
        })
    }

    handleUrlChange(event: React.FormEvent<HTMLInputElement>): void {
        this.setState({
            url: (event.target as HTMLInputElement).value,
        });
    }

    loadUrl(): void {
        if (!this.domReady) return;

        this.webviewBody.loadURL(this.state.url);
    }

    reload(): void {
        if (!this.domReady) return;

        this.webviewBody.reload();
    }

    handleDeviceChange(value: string): void {
        const selected = this.deviceOptions.find(item => item.title === value);
        this.setState({
            deviceWidth: selected.width,
            deviceHeight: selected.height,
        })

        this.props.setEmulatorMinWidth(selected.width + 10);

        if (this.domReady) {
            this.webviewBody.setUserAgent(selected.userAgent);
            this.webviewBody.reload();
        }
    }

    render(): JSX.Element {
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
                    <div className="phone" style={{width: this.state.deviceWidth, height: this.state.deviceHeight}}>
                        <div className="webviewHeader"></div>
                        <webview id={WEBVIEW_BODY_ID} src="about:blank"></webview>
                    </div>
                </div>
                <div className="emulatorAddressbar">
                    <input type="text" value={this.state.url} onChange={this.handleUrlChange} />
                    <button onClick={this.loadUrl}>Go</button>
                    <button onClick={this.reload}>Reload</button>
                </div>
            </div>
        );
    }
}