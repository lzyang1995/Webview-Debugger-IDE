/* eslint-disable react/prop-types */
import React, { useContext, useState, useEffect, useRef } from 'react';
import { remote } from 'electron';
import { Table, Input, Button, Popconfirm, Form } from 'antd';
import { MAIN_MODULE } from '../constants';

import '../assets/css/webview_menu_config/MenuConfig.css';

const { readWebviewConfigFile, writeWebViewConfigFile } = remote.require(MAIN_MODULE);

const EditableContext = React.createContext<any>(null);

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

interface EditableRowProps {
    index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

interface EditableCellProps {
    title: React.ReactNode;
    editable: boolean;
    children: React.ReactNode;
    dataIndex: string;
    record: DataSourceItem;
    handleSave: (record: DataSourceItem) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<Input>();
    const form = useContext(EditableContext);

    useEffect(() => {
        if (editing) {
            inputRef.current.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
        try {
            const values = await form.validateFields();

            toggleEdit();
            handleSave({ ...record, ...values });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[
                    {
                        required: true,
                        message: `${title} is required.`,
                    },
                ]}
            >
                <Input ref={inputRef} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
                <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
                    {children}
                </div>
            );
    }

    return <td {...restProps}>{childNode}</td>;
};

interface ColType {
    title: string;
    dataIndex: string;
    editable?: boolean;
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
            },
            {
                title: "Callback Name",
                dataIndex: "callback",
                editable: true,
            },
            {
                title: "Actions",
                dataIndex: "Actions",
                render: (_: any, record: DataSourceItem): JSX.Element => {
                    if (this.state.dataSource.length >= 1) {
                        return (
                            <div>
                                <button>Edit JSON Data</button>
                                <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
                                    <button>Delete</button>
                                </Popconfirm>
                            </div>
                        );
                    } else {
                        return null;
                    }
                }
            }
        ];

        this.state = {
            dataSource: null,
            selectedRowKeys: null
        }

        this.handleDelete = this.handleDelete.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
    }

    componentDidMount(): void {
        const config = readWebviewConfigFile();

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
            name: "New Item",
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

        writeWebViewConfigFile(config);
    }

    render(): JSX.Element {
        const { dataSource, selectedRowKeys } = this.state;
        const components = {
            body: {
                row: EditableRow,
                cell: EditableCell,
            },
        };

        const columns = this.tableCols.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record: DataSourceItem) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });

        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        }

        return (
            <div className="container">
                <div className="configTable">
                    <Button onClick={this.handleAdd} type="primary" style={{ marginBottom: 16 }}>
                        Add a New Menu Item
                    </Button>
                    <Table
                        components={components}
                        rowClassName={() => 'editable-row'}
                        bordered
                        dataSource={dataSource}
                        columns={columns}
                        rowSelection={rowSelection}
                    />
                </div>
                <div className="buttons">
                    <button>编辑配置文件</button>
                    <button onClick={this.onConfirm}>确认</button>
                    <button>取消</button>
                </div>
            </div>
        );
    }
}