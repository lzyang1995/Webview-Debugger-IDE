import React from 'react';
import { Button, Popconfirm } from 'antd';
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
                const cur = !span.closest("li").querySelector("ul").hidden;
                span.closest("li").querySelector("ul").hidden = cur;
                this.hidden.set(span.dataset.path, cur);
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

        ul.append(inputLi);
        input.focus();

        input.addEventListener("blur", () => {
            if (input.value.trim() === "") {
                inputLi.remove();
                if (span.dataset.isLeaf === "true") {
                    ul.remove();
                }
                return;
            }

            const { config } = this.props;
            const newConfig = cloneDeep(config);
            const cur = findNode(span.dataset.path, newConfig);

            let successMsg = [...(span.dataset.path.split("/").slice(2)), input.value].join("/");
            successMsg = "/" + successMsg;
            const newProtocol: ConfigLeaf = {
                name: input.value,
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
        errMsg.textContent = "内容不能为空！";
        errMsg.style.color = "red";
        errMsg.hidden = true;

        const input = document.createElement("input");
        input.type = "text";
        input.value = span.textContent;

        const oldPath = span.dataset.path;
        let newPath = oldPath.slice(0, oldPath.lastIndexOf("/"));

        span.replaceWith(input);
        input.focus();
        input.after(errMsg);

        input.addEventListener("focus", () => {
            errMsg.hidden = true;
        })

        input.addEventListener("blur", () => {
            if (input.value.trim() === "") {
                errMsg.hidden = false;
                return;
            }

            const value = input.value;

            newPath = newPath + "/" + value;
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
            cur.name = value;

            // since path name is changed, need to update this.hidden
            if (!cur.isLeaf) {
                const tmp = this.hidden.get(oldPath);
                this.hidden.delete(oldPath);
                this.hidden.set(newPath, tmp);
            }

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
            <div>
                <div id="treePanel" onClick={this.handleClick}>
                </div>
                <div>
                    <Button onClick={this.handleAdd} disabled={!canAdd}>添加</Button>
                    <Button onClick={this.handleEdit} disabled={!canEdit}>编辑</Button>
                    <Popconfirm title="确认删除?" onConfirm={this.handleDelete}>
                        <Button disabled={!canDelete}>删除</Button>
                    </Popconfirm>
                </div>
            </div>
        );
    }

}