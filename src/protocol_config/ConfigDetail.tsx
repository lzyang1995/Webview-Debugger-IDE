import React from 'react';
import cloneDeep from 'lodash.clonedeep';
import { Button, Popconfirm } from 'antd';
// eslint-disable-next-line import/no-unresolved
import * as monaco from 'monaco-editor';

import { findNode, ParamCallbackItem, ParamRegularItem, ConfigLeaf } from './ProtocolConfig';
import { ConfigDetailTable } from "./ConfigDetailTable";
import '../assets/css/protocol_config/ConfigDetail.css';

export interface ConfigDetailProps {
    selectedItem: string;
    config: object;
    setConfig: (config: object) => void;
}

export class ConfigDetail extends React.Component<ConfigDetailProps, {}> {

    constructor(props: ConfigDetailProps) {
        super(props);

        this.handleDelete = this.handleDelete.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.handleJsonDataClick = this.handleJsonDataClick.bind(this);
    }

    handleClick(tagName: string, callback: (cur: ConfigLeaf, val: string) => void): (event: any) => void {
        return (event: any): void => {
            const target = event.target as HTMLElement;

            const input = document.createElement(tagName) as HTMLInputElement | HTMLTextAreaElement;
            input.value = target.textContent;
            input.classList.add("ant-input");

            const errMsg = document.createElement("span");
            errMsg.style.color = "red";
            errMsg.hidden = true;

            input.addEventListener("focus", () => {
                errMsg.hidden = true;
            })

            input.addEventListener("blur", () => {
                const value = input.value;
                if (value.trim() === "") {
                    errMsg.textContent = "Cannot be empty";
                    errMsg.hidden = false;
                    return;
                }

                const { selectedItem, config } = this.props;
                const newConfig = cloneDeep(config);
                const cur = findNode(selectedItem, newConfig) as ConfigLeaf;

                try {
                    callback(cur, value);
                } catch (err) {
                    errMsg.textContent = err.name + ": " + err.message;
                    errMsg.hidden = false;
                    return;
                }

                errMsg.remove()
                input.replaceWith(target); // This can work... great.
                this.props.setConfig(newConfig);
            })

            target.replaceWith(input);
            input.focus();
            input.after(errMsg);
        }
    }

    handleDelete(key: number): void {
        const { selectedItem, config } = this.props;
        const newConfig = cloneDeep(config);
        const cur = findNode(selectedItem, newConfig) as ConfigLeaf;
        const params = cur.params;
        const ind = params.findIndex(item => item.key === key);
        params.splice(ind, 1);
        this.props.setConfig(newConfig);
    }

    handleSave(newParamItem: ParamCallbackItem | ParamRegularItem): void {
        const { selectedItem, config } = this.props;
        const newConfig = cloneDeep(config);
        const cur = findNode(selectedItem, newConfig) as ConfigLeaf;
        const params = cur.params;
        const ind = params.findIndex(item => item.key === newParamItem.key);
        const oldItem = params[ind];

        const newItem = { ...oldItem, ...newParamItem } as any;

        if (newItem.name === "callback") {
            newItem.type = "callback";

            if (newItem.reaction) {
                delete newItem.reaction;
            }

            if (newItem.data === undefined) {
                newItem.data = {};
            }
        } else {
            newItem.type = "regular";

            if (newItem.data !== undefined) {
                delete newItem.data;
            }

            if (newItem.reaction === undefined) {
                newItem.reaction = "NONE";
            }
        }

        params.splice(ind, 1, newItem);
        this.props.setConfig(newConfig);
    }

    handleAdd(type: string): void {
        const { selectedItem, config } = this.props;
        const newConfig = cloneDeep(config);
        const cur = findNode(selectedItem, newConfig) as ConfigLeaf;
        const params = cur.params;

        let maxKey = -1;
        for (const item of params) {
            if (item.key > maxKey) {
                maxKey = item.key;
            }
        }

        const newItem: any = {
            key: maxKey + 1,
            name: "newParam" + (maxKey + 1),
            type: type,
        };
        if (type === "regular") {
            newItem.reaction = "NONE";
        } else {
            newItem.data = {};
        }

        params.push(newItem);
        this.props.setConfig(newConfig);
    }

    handleJsonDataClick(event: any): void {
        const target = event.target as HTMLElement;

        const editorContainer = document.createElement("div");
        const configDetail = document.querySelector(".configDetail");
        editorContainer.style.height = configDetail.clientHeight - parseInt(getComputedStyle(configDetail).padding) - target.getBoundingClientRect().top - 30 + "px";

        const errMsg = document.createElement("span");
        errMsg.style.color = "red";
        errMsg.hidden = true;

        target.replaceWith(editorContainer);
        editorContainer.after(errMsg);

        const editor = monaco.editor.create(editorContainer, {
            value: target.textContent,
            language: 'json',
            theme: "vs-dark",
            codeLens: false,
        });

        editor.layout();
        editor.focus();

        editor.onDidFocusEditorText(() => {
            errMsg.hidden = true;
        })

        editor.onDidBlurEditorText(() => {
            const value = editor.getValue();
            if (value.trim() === "") {
                errMsg.textContent = "Cannot be empty";
                errMsg.hidden = false;
                return;
            }

            const { selectedItem, config } = this.props;
            const newConfig = cloneDeep(config);
            const cur = findNode(selectedItem, newConfig) as ConfigLeaf;

            try {
                const params = cur.params;
                const callbackItem = params.find(item => item.name === "callback") as ParamCallbackItem;

                if (!callbackItem) throw new Error("No Callback Parameter Found");

                callbackItem.data = JSON.parse(value.trim());
            } catch (err) {
                errMsg.textContent = err.name + ": " + err.message;
                errMsg.hidden = false;
                return;
            }

            errMsg.remove()
            editorContainer.replaceWith(target); // This can work... great.
            this.props.setConfig(newConfig);
        })
    }

    render(): JSX.Element {
        const { selectedItem, config } = this.props;

        if (selectedItem === "") return <div className="configDetail"></div>;

        const selectedItemInfo = findNode(selectedItem, config) as ConfigLeaf;
        const successMsg = selectedItemInfo.successMsg;
        const params = selectedItemInfo.params;

        const dataSource = params;
        const callbackItem = params.find(item => item.name === "callback") as ParamCallbackItem;

        const tableCols = [
            {
                title: "Param Name",
                dataIndex: "name",
                editable: true,
                render: (name: any): JSX.Element => {
                    if (name === "callback") {
                        return <span style={{ color: "orangered" }}>{name}</span>;
                    } else {
                        return name;
                    }
                }
            },
            {
                title: "Actions",
                dataIndex: "Actions",
                render: (_: any, record: ParamRegularItem | ParamCallbackItem): JSX.Element => {
                    if (dataSource.length >= 1) {
                        return (
                            <Popconfirm title="Sure to Delete?" onConfirm={() => this.handleDelete(record.key)}>
                                <Button>Delete</Button>
                            </Popconfirm>
                        );
                    } else {
                        return null;
                    }
                }
            }
        ];

        const handleSuccessMsgClick = this.handleClick("input", (cur: ConfigLeaf, val: string): void => {
            cur.successMsg = val;
        })

        return (
            <div className="configDetail">
                <div className="successMsg">
                    <h3>Success Message: </h3>
                    <span onClick={handleSuccessMsgClick}>{successMsg}</span>
                </div>
                <div className="configDetailTable">
                    <h3>Parameters:</h3>
                    <ConfigDetailTable
                        dataSource={dataSource}
                        columns={tableCols}
                        handleSave={this.handleSave}
                    />
                    <Button onClick={() => this.handleAdd("regular")}>Add</Button>
                </div>
                {
                    callbackItem ?
                        (<div className="jsonData">
                            <h3>Edit JSON Data: </h3>
                            <pre onClick={this.handleJsonDataClick}>{JSON.stringify(callbackItem.data, null, 4)}</pre>
                        </div>) :
                        null
                }
            </div>
        );
    }
}