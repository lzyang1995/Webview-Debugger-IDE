import React from 'react';
import '../assets/css/main_window/Emulator.css';

// export interface EmulatorProps {}
// export interface EmulatorState {}

export const WEBVIEW_BODY_ID = "webviewBody";

export interface EmulatorStates {
    url: string;
}

export class Emulator extends React.Component<{}, EmulatorStates> {

    private domReady: boolean;
    private webviewBody: Electron.WebviewTag;

    constructor(props: {}) {
        super(props);

        this.state = {
            url: "",
        }

        this.domReady = false;

        this.handleUrlChange = this.handleUrlChange.bind(this);
        this.loadUrl = this.loadUrl.bind(this);
        this.reload = this.reload.bind(this);
    }

    componentDidMount(): void {
        this.webviewBody = document.getElementById(WEBVIEW_BODY_ID) as Electron.WebviewTag;
        (this.webviewBody as HTMLElement).addEventListener('dom-ready', () => {
            this.domReady = true;
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

    render(): JSX.Element {
        return (
            <div className="emulatorContainer">
                <div className="emulatorToolbar"></div>
                <div className="emulatorPhone">
                    <div className="phone">
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