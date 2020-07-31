import React from 'react';
import { remote, BrowserView as BrowserViewType } from 'electron';
import '../assets/css/main_window/ConsoleContent.css';

const { BrowserView } = remote;

export const DEVTOOLS_PANEL_ID = "devtoolsPanel";

// export function ConsoleContent(): JSX.Element {
//     return (
//         <webview id="devtoolsPanel" src="about:blank"></webview>
//     );
// }

export class ConsoleContent extends React.Component<{}, {}> {

    private devtoolView: BrowserViewType;
    private devtoolsPanel: HTMLElement;

    constructor(props: {}) {
        super(props);

        this.devtoolView = new BrowserView();
        remote.getCurrentWindow().addBrowserView(this.devtoolView);
        // this.updateDevtoolSize = this.updateDevtoolSize.bind(this);
    }

    componentDidMount(): void {
        this.devtoolsPanel = document.getElementById(DEVTOOLS_PANEL_ID);
        this.updateDevtoolSize();
    }

    updateDevtoolSize(): void {
        const rect = this.devtoolsPanel.getBoundingClientRect();
        this.devtoolView.setBounds({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
        });
    }

    render(): JSX.Element {
        return (
            <div id={DEVTOOLS_PANEL_ID}></div>
        );
    }

} 