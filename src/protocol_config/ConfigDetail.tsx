import React from 'react';
import cloneDeep from 'lodash.clonedeep';
import { Button, Popconfirm } from 'antd';

import { findNode, ParamCallbackItem, ParamRegularItem, ConfigLeaf } from './ProtocolConfig';
import { ConfigDetailTable } from "./ConfigDetailTable";
import '../assets/css/protocol_config/ConfigDetail.css';

export interface ConfigDetailProps {
    selectedItem: string;
    config: object;
    setConfig: (config: object) => void;
}

export interface ConfigDetailStates {
    isSuccessMsgEditing: boolean;
    errMsgHidden: boolean;
}

export class ConfigDetail extends React.Component<ConfigDetailProps, ConfigDetailStates> {

    constructor(props: ConfigDetailProps) {
        super(props);

        this.handleSuccessMsgClick = this.handleSuccessMsgClick.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleAdd = this.handleAdd.bind(this);

        this.state = {
            isSuccessMsgEditing: false,
            errMsgHidden: true,
        }
    }

    handleSuccessMsgClick(event: any): void {
        const span = event.target as HTMLElement;

        const input = document.createElement("input");
        input.value = span.textContent;

        const errMsg = document.createElement("span");
        errMsg.textContent = "输入内容不能为空！";
        errMsg.style.color = "red";
        errMsg.hidden = true;

        input.addEventListener("focus", () => {
            errMsg.hidden = true;
        })

        input.addEventListener("blur", () => {
            const value = input.value;
            if (value.trim() === "") {
                errMsg.hidden = false;
                return;
            }

            errMsg.remove()
            input.replaceWith(span); // This can work... great.

            const { selectedItem, config } = this.props;
            const newConfig = cloneDeep(config);
            const cur = findNode(selectedItem, newConfig) as ConfigLeaf;
            cur.successMsg = value;
            this.props.setConfig(newConfig);
        })

        span.replaceWith(input);
        input.focus();
        input.after(errMsg);
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
        params.splice(ind, 1, {
            ...oldItem,
            ...newParamItem
        });
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
            name: "newParam",
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

    render(): JSX.Element {
        const { selectedItem, config } = this.props;

        if (selectedItem === "") return <div></div>;

        const selectedItemInfo = findNode(selectedItem, config) as ConfigLeaf;
        const successMsg = selectedItemInfo.successMsg;
        const params = selectedItemInfo.params;

        const callbackTableDataSource = params.filter(item => item.type === "callback");
        const regularTableDataSource = params.filter(item => item.type === "regular");

        const callbackTableCols = [
            {
                title: "Param Name",
                dataIndex: "name",
                editable: true,
            },
            {
                title: "JSON Data",
                dataIndex: "_data",
                render: (_: any, record: ParamCallbackItem): JSX.Element => {
                    if (callbackTableDataSource.length >= 1) {
                        return (
                            <Button>Edit</Button>
                        );
                    } else {
                        return null;
                    }
                }
            },
            {
                title: "Actions",
                dataIndex: "Actions",
                render: (_: any, record: ParamCallbackItem): JSX.Element => {
                    if (callbackTableDataSource.length >= 1) {
                        return (
                            <Popconfirm title="确认删除?" onConfirm={() => this.handleDelete(record.key)}>
                                <Button>Delete</Button>
                            </Popconfirm>
                        );
                    } else {
                        return null;
                    }
                }
            }
        ];

        const regularTableCols = [
            {
                title: "Param Name",
                dataIndex: "name",
                editable: true,
            },
            {
                title: "Actions",
                dataIndex: "Actions",
                render: (_: any, record: ParamRegularItem): JSX.Element => {
                    if (regularTableDataSource.length >= 1) {
                        return (
                            <Popconfirm title="确认删除?" onConfirm={() => this.handleDelete(record.key)}>
                                <Button>Delete</Button>
                            </Popconfirm>
                        );
                    } else {
                        return null;
                    }
                }
            }
        ];

        return (
            <div>
                <div className="successMsg">
                    Success Message: <span onClick={this.handleSuccessMsgClick}>{successMsg}</span>
                </div>
                <div>
                    <p>Callbacks</p>
                    <ConfigDetailTable 
                        dataSource={callbackTableDataSource}
                        columns={callbackTableCols}
                        handleSave={this.handleSave}
                    />
                    <Button type="primary" onClick={() => this.handleAdd("callback")}>添加</Button>
                </div>
                <div>
                    <p>Regular</p>
                    <ConfigDetailTable 
                        dataSource={regularTableDataSource}
                        columns={regularTableCols}
                        handleSave={this.handleSave}
                    />
                    <Button type="primary" onClick={() => this.handleAdd("regular")}>添加</Button>
                </div>
            </div>
        );
    }
}