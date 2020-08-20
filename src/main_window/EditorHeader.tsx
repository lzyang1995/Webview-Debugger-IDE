import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { remote, ipcRenderer } from 'electron';
import path from 'path';

import { Tab } from './App';
import { MAIN_MODULE } from '../constants';
import '../assets/css/main_window/EditorHeader.css';

const { dialog } = remote;
const { saveRegularFile } = remote.require(MAIN_MODULE);

export interface EditorHeaderProps {
    focusedIndex: number;
    tabs: Array<Tab>;
    updateFocusedIndex: (ind: number) => void;
    updateFocusedIndexAndTabs: (focusedIndex: number, tabs: Array<Tab>) => void;
}

export class EditorHeader extends React.Component<EditorHeaderProps, {}> {

    private scrollLeft: number;

    constructor(props: EditorHeaderProps) {
        super(props);

        this.scrollLeft = 0;
    }

    scrollFocusedIntoView(): void {
        const { focusedIndex, tabs } = this.props;

        if (focusedIndex === -1) {
            this.scrollLeft = 0;
            return;
        }

        const focusedSpan = document.getElementById(tabs[focusedIndex].fullpath);
        const editorHeader = document.getElementById("editorHeader");

        editorHeader.scrollLeft = this.scrollLeft;

        const editorHeaderRect = editorHeader.getBoundingClientRect();
        const focusedSpanRect = focusedSpan.getBoundingClientRect();

        const dis = focusedSpanRect.left - editorHeaderRect.left;
        if (dis < 0) {
            editorHeader.scrollLeft += dis;
        } else if (editorHeaderRect.width - dis < focusedSpanRect.width) {
            editorHeader.scrollLeft += (focusedSpanRect.width - (editorHeaderRect.width - dis));
        }

        this.scrollLeft = editorHeader.scrollLeft;

        // check whether overflow happens
        const lastSpan = document.getElementById(tabs[tabs.length - 1].fullpath);
        const firstSpan = document.getElementById(tabs[0].fullpath);
        const lastSpanRect = lastSpan.getBoundingClientRect();
        const firstSpanRect = firstSpan.getBoundingClientRect();

        if (lastSpanRect.right > editorHeaderRect.right || firstSpanRect.left < editorHeaderRect.left) {
            editorHeader.style.height = "40px";
        } else {
            editorHeader.style.height = "32px";
        }
    }

    componentDidMount(): void {
        const editorHeader = document.getElementById("editorHeader");
        editorHeader.addEventListener("scroll", () => {
            this.scrollLeft = editorHeader.scrollLeft;
        });
        this.scrollFocusedIntoView();

        ipcRenderer.on("close-file", (event) => {
            const { focusedIndex, tabs } = this.props;
            this.handleTabClose(tabs[focusedIndex].fullpath);
        })
    }

    componentDidUpdate(): void {
        this.scrollFocusedIntoView();
    }

    async handleTabClose(fullpath: string): Promise<any> {
        const { focusedIndex, tabs } = this.props;

        const tabInd = tabs.findIndex(item => item.fullpath === fullpath);

        if (tabs[tabInd].changed) {
            const result = await dialog.showMessageBox(remote.getCurrentWindow(), {
                message: "Your changes will be lost if you don't save them",
                title: "You have unsaved changes",
                type: "warning",
                buttons: ["Save", "Don't save", "Cancel"],
                defaultId: 0,
                cancelId: 2,
                noLink: true
            });

            if (result.response === 2) {
                return;
            } else if (result.response === 1) {
                this.onClose(tabInd, focusedIndex, tabs);
            } else {
                saveRegularFile(tabs[tabInd].fullpath, tabs[tabInd].model.getValue(), true);
                this.onClose(tabInd, focusedIndex, tabs);
            }
        } else {
            this.onClose(tabInd, focusedIndex, tabs);
        }
    }

    onClose(tabInd: number, focusedIndex: number, tabs: Array<Tab>): void {
        const newTabs = [...tabs];
        
        if (!newTabs[tabInd].model.isDisposed()) {
            newTabs[tabInd].model.dispose();
        }

        newTabs.splice(tabInd, 1);
        if (tabInd > focusedIndex) {
            this.props.updateFocusedIndexAndTabs(focusedIndex, newTabs);
        } else if (tabInd < focusedIndex) {
            this.props.updateFocusedIndexAndTabs(focusedIndex - 1, newTabs);
        } else {
            if (tabs.length === 1) {
                this.props.updateFocusedIndexAndTabs(-1, []);
            } else if (tabInd === tabs.length - 1) {
                this.props.updateFocusedIndexAndTabs(newTabs.length - 1, newTabs);
            } else {
                this.props.updateFocusedIndexAndTabs(focusedIndex, newTabs);
            }
        }
    }

    handleTabClick(event: any, fullpath: string): void {
        const span = (event.target as HTMLElement).closest("span");
        if (span.classList.contains("anticon-close")) return;

        const { focusedIndex, tabs } = this.props;

        const clickedInd = tabs.findIndex(item => item.fullpath === fullpath);

        if (clickedInd === focusedIndex) return;

        this.props.updateFocusedIndex(clickedInd);
    }

    render(): JSX.Element {
        const { focusedIndex, tabs } = this.props;

        return (
            <div id="editorHeader">
                {
                    tabs.map((item, index) => {
                        const { fullpath, changed } = item;

                        let filename = !isNaN(+fullpath) ? "New File " + fullpath : path.basename(fullpath);
                        filename += changed ? "*" : "";

                        const backgroundColor = index === focusedIndex ? "rgb(30,30,30)" : "rgb(45,45,45)";

                        return (
                            <span
                                key={fullpath}
                                id={fullpath}
                                style={{ backgroundColor: backgroundColor, cursor: "pointer" }}
                                onClick={(event) => this.handleTabClick(event, fullpath)}
                            >
                                <span style={{ marginRight: 10 }}>{filename}</span>
                                <CloseOutlined onClick={() => this.handleTabClose(fullpath)} />
                            </span>
                        )
                    })
                }
            </div>
        );
    }
}