import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.dark.css';

import { Titlebar, Color, RGBA } from 'custom-electron-titlebar';
import { MenuConfig } from './MenuConfig';

new Titlebar({
    backgroundColor: new Color(new RGBA(66, 66, 66, 1)),
    menu: null
});

ReactDOM.render(
    <MenuConfig />,
    document.getElementById("root")
);