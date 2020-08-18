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
        const { dataSource, columns } = this.props;

        const paramNames = dataSource.map(item => item.name);

        const newColumns = columns.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record: ParamCallbackItem | ParamRegularItem) => {
                    const otherParams = [...paramNames];
                    otherParams.splice(otherParams.indexOf(record.name), 1);

                    return {
                        record,
                        otherParams,
                        editable: col.editable,
                        dataIndex: col.dataIndex,
                        title: col.title,
                        handleSave: this.props.handleSave,
                    }
                },
            };
        });

        return (
            <Table
                components={tableComponent}
                rowClassName={() => 'editable-row'}
                bordered
                dataSource={dataSource}
                columns={newColumns}
                pagination={false}
            />
        );
    }
}