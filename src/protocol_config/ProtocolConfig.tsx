import React from 'react';
import Split from 'react-split';
import { remote } from 'electron';
import { MAIN_MODULE } from '../constants';
import { Button, Space } from 'antd';

import { TreePanel } from './TreePanel';
import { ConfigDetail } from './ConfigDetail';
import { getElementStyle, getGutterStyle } from "../functions";

import '../assets/css/protocol_config/ProtocolConfig.css';

const { readProtocolConfig, writeProtocolConfig } = remote.require(MAIN_MODULE);

export interface ProtocolConfigState {
    selectedItem: string;
    config: object;
}

export interface ParamCallbackItem {
    key: number;
    name: string;
    type: string;
    data: object;
}

export interface ParamRegularItem {
    key: number;
    name: string;
    type: string;
    reaction: string;
}

export interface ConfigLeaf {
    name: string;
    isLeaf: boolean;
    successMsg: string;
    params: Array<ParamCallbackItem | ParamRegularItem>;
}

export interface ConfigNode {
    name: string;
    isLeaf: boolean;
    descendants: Array<ConfigLeaf | ConfigNode>;
}

export function findNode(selectedItem: string, config: object): any {
    const path = selectedItem.split('/').slice(2);

    let cur = config as any;
    for (const segment of path) {
        cur = cur.descendants.find((item: ConfigLeaf | ConfigNode) => item.name === segment);
    }

    return cur;
}

export class ProtocolConfig extends React.Component<{}, ProtocolConfigState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            selectedItem: "",
            config: null
        }

        this.setSelectedItem = this.setSelectedItem.bind(this);
        this.setConfig = this.setConfig.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
    }

    componentDidMount(): void {
        const config = readProtocolConfig();
        this.setState({
            config
        })
    }

    setConfig(config: object): void {
        this.setState({
            config,
        })
    }

    setSelectedItem(selectedItem: string): void {
        this.setState({
            selectedItem,
        })
    }

    // getSelectedItemInfo(selectedItem: string): any {
    //     const { config } = this.state;
    //     const path = selectedItem.split('/').slice(2);

    //     let cur = config as any;
    //     for (const segment of path) {
    //         cur = cur.descendants.find((item: ConfigLeaf | ConfigNode) => item.name === segment);
    //     }

    //     return cur;
    // }

    onConfirm(): void {
        writeProtocolConfig(this.state.config);
        remote.getCurrentWindow().close();
    }

    onCancel(): void {
        remote.getCurrentWindow().close();
    }

    render(): JSX.Element {
        const { selectedItem, config } = this.state;

        if (config === null) {
            return <div></div>;
        }

        // let selectedItemInfo: ConfigLeaf;
        // if (selectedItem === "") {
        //     selectedItemInfo = null;
        // } else {
        //     selectedItemInfo = findNode(selectedItem, config);
        // }

        return (
            <div className="container">
                <Split
                    className="mainContent"
                    sizes={[40, 60]}
                    minSize={[200, 200]}
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
                    <TreePanel
                        config={config}
                        setSelectedItem={this.setSelectedItem}
                        setConfig={this.setConfig}
                    />
                    <ConfigDetail
                        selectedItem={selectedItem}
                        config={config}
                        setConfig={this.setConfig}
                    />
                </Split>
                <div className="buttons">
                    <Space>
                        <Button>编辑配置文件</Button>
                        <Button onClick={this.onConfirm}>确认</Button>
                        <Button onClick={this.onCancel}>取消</Button>
                        <span></span>
                    </Space>
                </div>
            </div>
        );
    }
}