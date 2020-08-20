import React from 'react';
import { remote, ipcRenderer } from 'electron';
import { Tree } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import cloneDeep from 'lodash.clonedeep';
import InlineSVG from 'svg-inline-react';

import { File } from './App';
import { MAIN_MODULE } from '../constants';
import '../assets/css/main_window/FileExplorer.css';

const { getDirContent } = remote.require(MAIN_MODULE);

export interface FileExplorerProps {
    fileExplorerTree: Array<any>;
    handleFileSelect: (seletedFile: File) => void;
    onLoadFileExplorerTreeData: (node: any) => Promise<any>;
}

// export interface FileExplorerStates {
//     treeData: Array<any>;
// }

export class FileExplorer extends React.Component<FileExplorerProps, {}> {

    constructor(props: FileExplorerProps) {
        super(props);

        // we want to change the icon property of treeData items from string to
        // corresponding JSX Element. However, it seems that we can not change
        // the object returned from methods of main process. Otherwise, the program 
        // cannot start up. So we have to make a clone of it.
        // const treeData = cloneDeep(getDirContent(props.rootPath));
        // this.strToElement(treeData);
        // this.state = {
        //     treeData,
        // }

        // ipcRenderer.on("directory-refresh", (event, dirPath, result) => {
        //     const { treeData } = this.state;
        //     const newTreeData = cloneDeep(treeData);
        //     const node = this.findNodeByKey(newTreeData, dirPath);

        //     const resultClone = cloneDeep(result);
        //     this.strToElement(resultClone);

        //     node.children = resultClone;
        //     this.setState({
        //         treeData: newTreeData,
        //     })
        // })

        this.onSelect = this.onSelect.bind(this);
        // this.onLoadData = this.onLoadData.bind(this);
    }

    // findNodeByKey(data: Array<any>, key: string): any {
    //     const cur = data.find(item => key.startsWith(item.key));

    //     if (cur.key === key) {
    //         return cur;
    //     } else {
    //         return this.findNodeByKey(cur.children, key);
    //     }
    // }

    // strToElement(treeData: Array<any>): void {
    //     for (const item of treeData) {
    //         if (item.icon) {
    //             item.icon = <InlineSVG src={item.icon} />;
    //         }
    //     }
    // }

    onSelect(keys: any, event: any): void {
        // console.log(event);
        const node = event.node;
        if (node.children) return;

        this.props.handleFileSelect({
            name: node.title as string,
            fullpath: node.key as string,
        })
    }

    // onLoadData(node: any): Promise<any> {
    //     return new Promise((resolve) => {
    //         if (node.children) {
    //             resolve();
    //             return;
    //         }

    //         const childrenResult = cloneDeep(getDirContent(node.key));
    //         this.strToElement(childrenResult);

    //         const newTreeData = cloneDeep(this.state.treeData);
    //         const newNode = this.findNodeByKey(newTreeData, node.key);

    //         newNode.children = childrenResult;
    //         this.setState({
    //             treeData: newTreeData,
    //         });
    //         resolve();
    //     })
    // }

    render(): JSX.Element {

        // const treeData = cloneDeep(getFileTree(this.props.rootPath));
        // console.log(treeData)
        // this.strToElement(treeData);
        // console.log(treeData);

        // return (
        //     <div>
        //         <InlineSVG src={treeData[0].icon} />
        //         <InlineSVG src={treeData[1].icon} />
        //         <InlineSVG src={treeData[2].icon} />
        //         <InlineSVG src={treeData[3].icon} />
        //     </div>
        // )
        const { fileExplorerTree, onLoadFileExplorerTreeData } = this.props;

        return (
            <div id="file-explorer">
                <div id="file-explorer-header">File Explorer</div>
                <div id="file-explorer-content">
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

        // if (fileExplorerTree === null) {
        //     return <div></div>
        // } else {

        // }



        // return null;
    }

}