import React from 'react';
import '../assets/css/main_window/ConsoleContent.css';

export function ConsoleContent(): JSX.Element {
    return (
        <webview id="devtoolsPanel"></webview>
    );
}