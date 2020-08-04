import React from 'react';
import { Table } from 'antd';
import { ParamCallbackItem, ParamRegularItem } from './ProtocolConfig';
import { tableComponent } from '../table_components/tableComponent';

export interface ConfigDetailTableProps {
    dataSource: Array<any>;
    columns: Array<any>;
    handleSave: (newParamItem: ParamCallbackItem | ParamRegularItem) => void;
}

export class ConfigDetailTable extends React.Component<ConfigDetailTableProps, {}> {
    render(): JSX.Element {
        const columns = this.props.columns.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record: ParamCallbackItem | ParamRegularItem) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.props.handleSave,
                }),
            };
        });

        return (
                <Table
                    components={tableComponent}
                    rowClassName={() => 'editable-row'}
                    bordered
                    dataSource={this.props.dataSource}
                    columns={columns}
                />
        );
    }
}