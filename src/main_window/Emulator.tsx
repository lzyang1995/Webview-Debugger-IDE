import React from 'react';
import '../assets/css/main_window/Emulator.css';

// export interface EmulatorProps {}
// export interface EmulatorState {}

export class Emulator extends React.Component<{}, {}> {
    render(): JSX.Element {
        return (
            <div className="emulatorContainer">
                <div className="phone">
                    <div className="webviewHeader"></div>
                    <webview id="webviewBody"></webview>
                </div>
            </div>
        );
    }
}