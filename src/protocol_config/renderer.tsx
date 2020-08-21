import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.dark.css';

import { Titlebar, Color, RGBA } from 'custom-electron-titlebar';
import { ProtocolConfig } from './ProtocolConfig';

new Titlebar({
    backgroundColor: new Color(new RGBA(66, 66, 66, 1)),
    menu: null
});

ReactDOM.render(
    <ProtocolConfig />,
    document.getElementById("root")
);