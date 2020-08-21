import React from 'react';
import { Button, Popconfirm, Space } from 'antd';
import cloneDeep from 'lodash.clonedeep';

import { findNode, ConfigLeaf, ConfigNode } from './ProtocolConfig';
import '../assets/css/protocol_config/TreePanel.css';

const FOCUSED_SPAN_CLASS = "focusedSpan";

export interface TreePanelProps {
    config: object;
    setSelectedItem: (selectedItem: string) => void;
    setConfig: (config: object) => void;
}

export interface TreePanelStates {
    canDelete: boolean;
    canAdd: boolean;
    canEdit: boolean;
}

export const TREE_PANEL_CONTAINER_ID = "treePanelContainer";

/**
 * 新添加的节点默认为叶子结点。
 * 叶子结点允许添加。添加后，变为非叶子结点。
 * 非叶子结点，其叶子全部删除之后，变为叶子结点。
 */

export class TreePanel extends React.Component<TreePanelProps, TreePanelStates> {
    private hidden: Map<string, boolean>;
    private focusedSpan: HTMLElement;

    constructor(props: TreePanelProps) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleEdit = this.handleEdit.bind(this);

        this.hidden = new Map();
        this.focusedSpan = null;

        this.state = {
            canDelete: false,
            canAdd: false,
            canEdit: false,
        }
    }

    componentDidMount(): void {
        const { config } = this.props;

        const ul = document.createElement("ul");
        ul.append(this.createTree(config, "", ""));

        document.getElementById("treePanel").append(ul);

        // add gutter to right border of Tree Panel
        // const treePanelContainer = document.getElementById(TREE_PANEL_CONTAINER_ID);
        // const timer = setInterval(() => {
        //     const gutter = document.querySelector(".gutter-horizontal");
        //     console.log(gutter);
        //     if (gutter) {
        //         treePanelContainer.append(gutter);
        //         clearInterval(timer);
        //     }
        // }, 100);
    }

    componentDidUpdate(prevProps: TreePanelProps): void {
        // console.log(this.props.config === prevProps.config) 
        if (this.props.config === prevProps.config) return;

        const { config } = this.props;

        // before removing, get currently focused span path
        let focusedPath;
        if (this.focusedSpan) {
            focusedPath = this.focusedSpan.dataset.path;
        } else {
            focusedPath = "";
        }

        document.getElementById("treePanel").querySelector("ul").remove();

        const ul = document.createElement("ul");
        ul.append(this.createTree(config, "", focusedPath));

        document.getElementById("treePanel").append(ul);
    }

    createTree(curObj: any, currentPath: string, focusedPath: string): HTMLElement {
        const li = document.createElement("li");
        currentPath = currentPath + "/" + curObj.name;

        const span = document.createElement("span");
        span.textContent = curObj.name;
        span.setAttribute("data-is-leaf", String(curObj.isLeaf));
        span.setAttribute("data-path", currentPath);

        li.append(span);

        if (currentPath === focusedPath) {
            this.focusedSpan = span;
            span.classList.add(FOCUSED_SPAN_CLASS);
        }

        if (!curObj.isLeaf) {
            const ul = document.createElement("ul");
            for (const item of curObj.descendants) {
                ul.append(this.createTree(item, currentPath, focusedPath));
            }

            if (this.hidden.has(currentPath)) {
                ul.hidden = this.hidden.get(currentPath);
            } else {
                ul.hidden = true;
                this.hidden.set(currentPath, true);
            }

            if (ul.hidden) {
                li.style.listStyleType = "'\u25b8'";
            } else {
                li.style.listStyleType = "'\u25be'";
            }

            li.append(ul);
        }

        return li;
    }

    handleClick(event: any): void {
        if (event.target.tagName === 'SPAN') {
            const span = event.target;

            if (this.focusedSpan) {
                this.focusedSpan.classList.remove(FOCUSED_SPAN_CLASS);
            }

            this.focusedSpan = span;
            span.classList.add(FOCUSED_SPAN_CLASS);

            if (span.dataset.isLeaf === "false") {
                const li = span.closest("li");
                const cur = !li.querySelector("ul").hidden;
                li.querySelector("ul").hidden = cur;
                this.hidden.set(span.dataset.path, cur);

                if (cur) {
                    li.style.listStyleType = "'\u25b8'";
                } else {
                    li.style.listStyleType = "'\u25be'";
                }

                this.props.setSelectedItem("");
            } else {
                this.props.setSelectedItem(span.dataset.path);
            }

            let canDelete, canEdit;
            if (span.dataset.path === "/root") {
                canDelete = false;
                canEdit = false;
            } else {
                canDelete = true;
                canEdit = true;
            }

            this.setState({
                canAdd: true,
                canDelete,
                canEdit,
            });
        }
        // else {
        //     if (this.focusedSpan) {
        //         this.focusedSpan.classList.remove(FOCUSED_SPAN_CLASS);
        //     }
        //     this.focusedSpan = null;

        //     this.props.setSelectedItem("");
        //     this.setState({
        //         canAdd: false,
        //         canDelete: false,
        //         canEdit: false,
        //     })
        // }
    }

    handleAdd(): void {
        if (!this.focusedSpan) return;

        const span = this.focusedSpan;

        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("ant-input");
        const inputLi = document.createElement("li");
        inputLi.append(input);

        const parentLi = span.closest("li");
        let ul: HTMLElement;
        if (span.dataset.isLeaf === "true") {
            ul = document.createElement("ul");
            parentLi.append(ul);
        } else {
            ul = parentLi.querySelector("ul");
            ul.hidden = false;
            this.hidden.set(span.dataset.path, false);
        }

        parentLi.style.listStyleType = "'\u25be'";

        ul.append(inputLi);
        input.focus();

        // get the names of the same level. the name of the new item 
        // must be different from those of the same level.
        const parent = findNode(span.dataset.path, this.props.config);
        let sameLevelNames: Array<any>;
        if (span.dataset.isLeaf === "true") {
            sameLevelNames = [];
        } else {
            sameLevelNames = (parent as ConfigNode).descendants.map(item => item.name);
        }

        const errMsg = document.createElement("span");
        errMsg.style.color = "red";
        errMsg.hidden = true;
        input.after(errMsg);

        input.addEventListener("focus", () => {
            errMsg.hidden = true;
        })

        input.addEventListener("blur", () => {
            const val = input.value.trim();
            if (val === "") {
                inputLi.remove();
                if (span.dataset.isLeaf === "true") {
                    ul.remove();
                    parentLi.style.listStyleType = "none";
                }
                return;
            }

            if (sameLevelNames.includes(val)) {
                errMsg.textContent = val + "already exists.";
                errMsg.hidden = false;
                return;
            }

            const { config } = this.props;
            const newConfig = cloneDeep(config);
            const cur = findNode(span.dataset.path, newConfig);

            let successMsg = [...(span.dataset.path.split("/").slice(2)), val].join("/");
            successMsg = "/" + successMsg;
            const newProtocol: ConfigLeaf = {
                name: val,
                isLeaf: true,
                successMsg: "协议" + successMsg + "执行成功！",
                params: [],
            };

            if (!cur.isLeaf) {
                cur.descendants.push(newProtocol);
            } else {
                cur.isLeaf = false;
                delete cur.successMsg;
                delete cur.params;
                cur.descendants = [newProtocol];

                this.hidden.set(span.dataset.path, false);
            }

            this.props.setConfig(newConfig);
        })
    }

    handleDelete(): void {
        const span = this.focusedSpan;
        if (!span || span.dataset.path === "/root") return;

        const nonLeaves: NodeListOf<HTMLElement> = span.querySelectorAll('span[data-is-leaf="false"]');
        for (const elem of nonLeaves) {
            this.hidden.delete(elem.dataset.path);
        }
        this.hidden.delete(span.dataset.path);

        const { config } = this.props;
        const newConfig = cloneDeep(config);

        const parentPath = span.dataset.path.slice(0, span.dataset.path.lastIndexOf("/"));
        const cur = findNode(parentPath, newConfig);

        const ind = cur.descendants.findIndex((item: ConfigNode | ConfigLeaf) => item.name === span.textContent)
        cur.descendants.splice(ind, 1);

        if (cur.descendants.length === 0) {
            cur.isLeaf = true;
            delete cur.descendants;
            cur.successMsg = "协议" + parentPath + "执行成功！";
            cur.params = [];
        }

        if (this.focusedSpan) {
            this.focusedSpan.classList.remove(FOCUSED_SPAN_CLASS);
        }
        this.focusedSpan = null;
        this.setState({
            canAdd: false,
            canDelete: false,
            canEdit: false,
        })

        this.props.setSelectedItem("");
        this.props.setConfig(newConfig);
    }

    handleEdit(): void {
        const span = this.focusedSpan;
        if (!span || span.dataset.path === "/root") return;

        const errMsg = document.createElement("span");
        errMsg.style.color = "red";
        errMsg.hidden = true;

        const input = document.createElement("input");
        input.classList.add("ant-input");
        input.type = "text";
        input.value = span.textContent;

        const oldPath = span.dataset.path;
        let newPath = oldPath.slice(0, oldPath.lastIndexOf("/"));

        span.replaceWith(input);
        input.focus();
        input.after(errMsg);

        // get the names of the same level. the name of the new item 
        // must be different from those of the same level.
        const parent = findNode(newPath, this.props.config) as ConfigNode;
        const sameLevelNames = parent.descendants.map(item => item.name);
        const ind = sameLevelNames.findIndex(name => name === span.textContent);
        sameLevelNames.splice(ind, 1);

        input.addEventListener("focus", () => {
            errMsg.hidden = true;
        })

        input.addEventListener("blur", () => {
            const val = input.value.trim();
            if (val === "") {
                errMsg.textContent = "Cannot be empty";
                errMsg.hidden = false;
                return;
            }

            if (sameLevelNames.includes(val)) {
                errMsg.textContent = val + "already exists."
                errMsg.hidden = false;
                return;
            }

            newPath = newPath + "/" + val;
            if (this.focusedSpan) {
                this.focusedSpan.classList.remove(FOCUSED_SPAN_CLASS);
            }
            // set this.focusedSpan so that the currently focused span can 
            // still be highlighted correctly after re-rendering
            this.focusedSpan = document.createElement("span");
            this.focusedSpan.dataset.path = newPath;

            const { config } = this.props;
            const newConfig = cloneDeep(config);
            const cur = findNode(oldPath, newConfig);
            cur.name = val;

            // since path name is changed, need to update this.hidden
            if (!cur.isLeaf) {
                const tmp = this.hidden.get(oldPath);
                this.hidden.delete(oldPath);
                this.hidden.set(newPath, tmp);
            }

            this.props.setSelectedItem("");
            this.props.setConfig(newConfig);
            // since path name is changed, need to update selectedItem for leaves
            if (cur.isLeaf) {
                this.props.setSelectedItem(newPath);
            }
        })
    }

    render(): JSX.Element {
        const { canAdd, canDelete, canEdit } = this.state;

        return (
            <div id="treePanelContainer">
                <div id="treePanel" onClick={this.handleClick}>
                </div>
                <div className="treePanelButtons">
                    <Space>
                        <Button onClick={this.handleAdd} disabled={!canAdd}>添加</Button>
                        <Button onClick={this.handleEdit} disabled={!canEdit}>编辑</Button>
                        <Popconfirm title="确认删除?" onConfirm={this.handleDelete}>
                            <Button disabled={!canDelete}>删除</Button>
                        </Popconfirm>
                        <span></span>
                    </Space>
                </div>
            </div>
        );
    }

}