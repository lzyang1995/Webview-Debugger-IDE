import React from 'react';
import Split from 'react-split';
import '../assets/css/main_window/App.css';

function getElementStyle(
    dimension: "height" | "width",
    elementSize: number,
    gutterSize: number
): object {
    return {
        'flex-basis': `calc(${elementSize}% - ${gutterSize}px)`
    };
}

function getGutterStyle(
    dimension: "height" | "width",
    gutterSize: number
): object {
    return {
        'flex-basis': `${gutterSize}px`
    };
}

// function App(): JSX.Element {
//     return (
//         <Split
//             sizes={[25, 75]}
//             minSize={[500, 100]}
//             expandToMin={true}
//             gutterSize={5}
//             gutterAlign="center"
//             snapOffset={0}
//             dragInterval={1}
//             direction="horizontal"
//             cursor="ew-resize"
//             className="container"
//             elementStyle={getElementStyle}
//             gutterStyle={getGutterStyle}
//         >
//             <div id="div1"></div>
//             <div id="div2"></div>
//         </Split>
//     );
// }

export interface AppProps {
    emulator: JSX.Element;
    consoleContent: JSX.Element;
}

export function App(props: AppProps): JSX.Element {
    return (
        <div id="container">
            <div id="head"></div>
            <Split
                id="body"
                sizes={[30, 25, 45]}
                minSize={[500, 100, 200]}
                expandToMin={true}
                gutterSize={5}
                gutterAlign="center"
                snapOffset={0}
                dragInterval={1}
                direction="horizontal"
                cursor="ew-resize"
                elementStyle={getElementStyle}
                gutterStyle={getGutterStyle}
            >
                <div id="emulator">
                    { props.emulator } 
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
                >
                    <div id="editor"></div>
                    <div id="console">
                        <div id="console-choice"></div>
                        <div id="console-content">
                            { props.consoleContent }
                        </div>
                    </div>
                </Split>
            </Split>
        </div>
    );
}
