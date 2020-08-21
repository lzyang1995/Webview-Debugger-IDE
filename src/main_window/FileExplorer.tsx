import React from 'react';
import { Tree } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { File } from './App';
import '../assets/css/main_window/FileExplorer.css';

export interface FileExplorerProps {
    fileExplorerTree: Array<any>;
    projectName: string;
    handleFileSelect: (seletedFile: File) => void;
    onLoadFileExplorerTreeData: (node: any) => Promise<any>;
}

export class FileExplorer extends React.Component<FileExplorerProps, {}> {

    constructor(props: FileExplorerProps) {
        super(props);

        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(keys: any, event: any): void {
        // console.log(event);
        const node = event.node;
        if (node.children) return;

        this.props.handleFileSelect({
            name: node.title as string,
            fullpath: node.key as string,
        })
    }

    render(): JSX.Element {
        const { fileExplorerTree, projectName ,onLoadFileExplorerTreeData } = this.props;

        return (
            <div id="file-explorer">
                <div id="file-explorer-header">File Explorer</div>
                <div id="file-explorer-content">
                    <h3 className="projectName">{projectName === null ? "" : projectName}</h3>
                    {
                        fileExplorerTree === null ?
                            <div></div> :
                            <Tree
                                showIcon
                                treeData={fileExplorerTree}
                                onSelect={this.onSelect}
                                switcherIcon={<DownOutlined />}
                                loadData={onLoadFileExplorerTreeData}
                            />
                    }
                </div>
            </div>
        );
    }

}