/* eslint-disable react/prop-types */
import React from 'react';
import { remote } from 'electron';
import { Table, Button, Popconfirm, Space } from 'antd';
import cloneDeep from 'lodash.clonedeep';
// eslint-disable-next-line import/no-unresolved
import * as monaco from 'monaco-editor';

import { tableComponent } from "../table_components/tableComponent";
import { MAIN_MODULE } from '../constants';

import '../assets/css/webview_menu_config/MenuConfig.css';

const { readConfigFile, writeConfigFile, WEBVIEW_CONFIG_FILE_PATH } = remote.require(MAIN_MODULE);

export interface DataSourceItem {
    key: number;
    name: string;
    enabled: boolean;
    callback: string;
    data: object;
    [propName: string]: any;
}

export interface MenuConfigStates {
    dataSource: Array<DataSourceItem> | null;
    selectedRowKeys: Array<number> | null;
}

interface ColType {
    title: string;
    dataIndex: string;
    editable?: boolean;
    width?: number;
    render?(_: any, record: DataSourceItem): JSX.Element;
}

export class MenuConfig extends React.Component<{}, MenuConfigStates> {
    private nextKey: number;
    private tableCols: Array<ColType>;

    constructor(props: {}) {
        super(props);

        this.nextKey = 0;
        this.tableCols = [
            {
                title: "Menu Item Name",
                dataIndex: "name",
                editable: true,
                width: 300
            },
            {
                title: "Callback Name",
                dataIndex: "callback",
                editable: true,
                width: 300
            },
            {
                title: "Actions",
                dataIndex: "Actions",
                render: (_: any, record: DataSourceItem): JSX.Element => {
                    if (this.state.dataSource.length >= 1) {
                        return (
                            <Space>
                                <Button onClick={() => this.handleEdit(record.key)}>Edit JSON Data</Button>
                                <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
                                    <Button>Delete</Button>
                                </Popconfirm>
                            </Space>
                        );
                    } else {
                        return null;
                    }
                }
            }
        ];

        this.state = {
            dataSource: [],
            selectedRowKeys: []
        }

        this.handleDelete = this.handleDelete.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
    }

    componentDidMount(): void {
        const config = readConfigFile(WEBVIEW_CONFIG_FILE_PATH);

        if (config === null) {
            // no config file
            this.setState({
                dataSource: [],
                selectedRowKeys: []
            })
        } else {
            const dataSource = [];
            const selectedRowKeys = [];
            for (const item of config) {
                dataSource.push(Object.assign({}, item, { key: this.nextKey }));

                if (item.enabled) {
                    selectedRowKeys.push(this.nextKey);
                }

                this.nextKey++;
            }

            this.setState({
                dataSource,
                selectedRowKeys
            })
        }
    }

    handleEdit(key: number): void {
        const dataSource  = cloneDeep(this.state.dataSource);
        const item = dataSource.find(item => item.key === key);

        const editorContainer = document.querySelector(".editorContainer") as HTMLElement;
        const errMsg = document.querySelector(".errMsg") as HTMLElement;

        editorContainer.style.height = "500px";

        const editor = monaco.editor.create(editorContainer, {
            value: JSON.stringify(item.data, null, 4),
            language: 'json',
            theme: "vs-dark",
            codeLens: false,
        });

        editor.onDidFocusEditorText(() => {
            errMsg.textContent = ""
        });

        editor.onDidBlurEditorText(() => {
            const value = editor.getValue();
            if (value.trim() === "") {
                errMsg.textContent = "输入内容不能为空！";
                return;
            }

            try {
                item.data = JSON.parse(value.trim());
            } catch (err) {
                errMsg.textContent = err.name + ": " + err.message;
                return;
            }

            editor.dispose();
            this.setState({
                dataSource,
            });
        });

        setTimeout(() => {
            editor.layout();
            editor.focus();
        }, 500);
    }

    handleDelete(key: number): void {
        const { dataSource, selectedRowKeys } = this.state;
        this.setState({
            dataSource: dataSource.filter(item => item.key !== key),
            selectedRowKeys: selectedRowKeys.filter(item => item !== key)
        });
    }

    handleAdd(): void {
        const { dataSource, selectedRowKeys } = this.state;
        const newData = {
            key: this.nextKey,
            name: "New Item" + this.nextKey,
            enabled: true,
            callback: "callbackName",
            data: {}
        };
        this.nextKey++;
        this.setState({
            dataSource: [...dataSource, newData],
            selectedRowKeys: [...selectedRowKeys, newData.key]
        });
    }

    handleSave(row: DataSourceItem): void {
        const newData = [...this.state.dataSource];
        const index = newData.findIndex(item => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        this.setState({ dataSource: newData });
    }

    onSelectChange(selectedRowKeys: Array<number>): void {
        this.setState({
            selectedRowKeys
        })
    }

    onConfirm(): void {
        const { dataSource, selectedRowKeys } = this.state;
        const set = new Set(selectedRowKeys);

        const config = dataSource.map(item => ({
            name: item.name,
            callback: item.callback,
            enabled: set.has(item.key),
            data: item.data
        }));

        writeConfigFile(config, WEBVIEW_CONFIG_FILE_PATH);

        remote.getCurrentWindow().close();
    }

    onCancel(): void {
        remote.getCurrentWindow().close();
    }

    render(): JSX.Element {
        const { dataSource, selectedRowKeys } = this.state;

        const paramNames = dataSource.map(item => item.name);

        const columns = this.tableCols.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record: DataSourceItem) => {
                    const otherParams = [...paramNames];
                    otherParams.splice(otherParams.indexOf(record.name), 1);

                    return {
                        record,
                        otherParams,
                        editable: col.editable,
                        dataIndex: col.dataIndex,
                        title: col.title,
                        handleSave: this.handleSave,
                    }
                },
            };
        });

        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        }

        return (
            <div className="container">
                <div className="configTable">
                    <Table
                        components={tableComponent}
                        rowClassName={() => 'editable-row'}
                        bordered
                        dataSource={dataSource}
                        columns={columns}
                        rowSelection={rowSelection}
                        pagination={false}
                    />
                    <Button onClick={this.handleAdd} style={{ marginTop: 10, marginBottom: 10 }}>
                        Add a New Menu Item
                    </Button>
                    <p className="errMsg" style={{color: "red"}}>{""}</p>
                    <div className="editorContainer"></div>
                </div>
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