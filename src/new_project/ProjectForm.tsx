import React from 'react';
import {
    Input,
    Row,
    Col,
    Button,
    Radio,
    Space,
} from 'antd';
import { remote } from 'electron';
import path from "path";
import fs from "fs";
import { MAIN_MODULE } from '../constants';

import '../assets/css/new_project/ProjectForm.css';

const { dialog, app } = remote;
const { createProject } = remote.require(MAIN_MODULE);

export interface ProjectFormStates {
    protocolChoice: number;
    webviewMenuChoice: number;
    protocolFile: string;
    webviewMenuFile: string;
    projectName: string;
    projectRoot: string;
    projectNameErrorMsg: string;
    projectRootErrorMsg: string;
}

export class ProjectForm extends React.Component<{}, ProjectFormStates> {

    private protocolDefaultRef: React.RefObject<HTMLElement>;
    private protocolCustomRef: React.RefObject<HTMLElement>;
    private webviewMenuDefaultRef: React.RefObject<HTMLElement>;
    private webviewMenuCustomRef: React.RefObject<HTMLElement>;

    constructor(props: {}) {
        super(props);

        this.state = {
            protocolChoice: 1,
            webviewMenuChoice: 1,
            protocolFile: "default",
            webviewMenuFile: "default",
            projectName: "",
            projectRoot: "",
            projectNameErrorMsg: "",
            projectRootErrorMsg: "",
        }

        this.protocolDefaultRef = React.createRef();
        this.protocolCustomRef = React.createRef();
        this.webviewMenuDefaultRef = React.createRef();
        this.webviewMenuCustomRef = React.createRef();

        this.handleProtocolChoice = this.handleProtocolChoice.bind(this);
        this.handleWebviewMenuChoice = this.handleWebviewMenuChoice.bind(this);
        this.handleProjectName = this.handleProjectName.bind(this);
        this.handleProjectRoot = this.handleProjectRoot.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.handleProjectNameFocus = this.handleProjectNameFocus.bind(this);
        this.handleProjectRootFocus = this.handleProjectRootFocus.bind(this);
        this.onSelectProtocolFile = this.onSelectProtocolFile.bind(this);
        this.onSelectWebviewMenuFile = this.onSelectWebviewMenuFile.bind(this);
        this.onSelectProjectFolder = this.onSelectProjectFolder.bind(this);
    }

    handleProtocolChoice(event: any): void {
        // console.log(event.target.value);
        const val = event.target.value;
        if (val === 1) {
            this.setState({
                protocolChoice: val,
                protocolFile: "default",
            })
        } else {
            this.setState({
                protocolChoice: val,
            })
        }
    }

    handleWebviewMenuChoice(event: any): void {
        const val = event.target.value;
        if (val === 1) {
            this.setState({
                webviewMenuChoice: val,
                webviewMenuFile: "default",
            })
        } else {
            this.setState({
                webviewMenuChoice: val,
            })
        }
    }

    handleProjectName(event: any): void {
        this.setState({
            projectName: event.target.value,
        });
    }

    handleProjectRoot(event: any): void {
        this.setState({
            projectRoot: event.target.value,
        })
    }

    onConfirm(): void {
        const {
            protocolFile,
            webviewMenuFile,
            projectName,
            projectRoot
        } = this.state;

        if (projectName.trim() === "") {
            this.setState({
                projectNameErrorMsg: "Project name cannot be empty"
            });
            return;
        }

        if (projectRoot.trim() === "") {
            this.setState({
                projectRootErrorMsg: "Project parent folder cannot be empty"
            });
            return;
        }

        if (projectRoot === path.basename(projectName)) {
            this.setState({
                projectRootErrorMsg: "Project parent folder path is invalid."
            })
            return;
        }

        const targetFolder = path.join(projectRoot, projectName);
        if (fs.existsSync(targetFolder)) {
            this.setState({
                projectRootErrorMsg: "The project path " + targetFolder + " already exists. Please change the name or parent folder of the project."
            })
            return;
        }

        createProject(targetFolder, protocolFile, webviewMenuFile);
        remote.getCurrentWindow().close();
    }

    onCancel(): void {
        remote.getCurrentWindow().close();
    }

    handleProjectNameFocus(): void {
        const { projectRootErrorMsg } = this.state;

        if (projectRootErrorMsg.startsWith("The project path ")) {
            this.setState({
                projectNameErrorMsg: "",
                projectRootErrorMsg: ""
            })
        } else {
            this.setState({
                projectNameErrorMsg: "",
            })
        }
    }

    handleProjectRootFocus(): void {
        this.setState({
            projectRootErrorMsg: ""
        })
    }

    async onSelectProtocolFile(): Promise<any> {
        const { protocolFile } = this.state;

        const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: "Select Protocol Configuration File",
            defaultPath: app.getPath("documents"),
            filters: [
                { name: "JSON File", extensions: ['json'] },
            ],
            properties: ['openFile']
        });

        if (result.canceled) {
            if (protocolFile === "default") {
                this.protocolDefaultRef.current.focus();
                this.setState({
                    protocolChoice: 1,
                })
            }
            return;
        }

        const filepath = result.filePaths[0];
        this.setState({
            protocolFile: filepath,
        })
    }

    async onSelectWebviewMenuFile(): Promise<any> {
        const { webviewMenuFile } = this.state;

        const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: "Select Webview Menu Configuration File",
            defaultPath: app.getPath("documents"),
            filters: [
                { name: "JSON File", extensions: ['json'] },
            ],
            properties: ['openFile']
        });

        if (result.canceled) {
            if (webviewMenuFile === "default") {
                this.webviewMenuDefaultRef.current.focus();
                this.setState({
                    protocolChoice: 1,
                })
            }
            return;
        }

        const filepath = result.filePaths[0];
        this.setState({
            webviewMenuFile: filepath,
        })
    }

    async onSelectProjectFolder(): Promise<any> {
        const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: "Select Project Parent Folder",
            defaultPath: app.getPath("documents"),
            properties: ['openDirectory']
        });

        if (result.canceled) {
            return;
        }

        const folder = result.filePaths[0];
        this.setState({
            projectRoot: folder,
            projectRootErrorMsg: "",
        })
    }

    render(): JSX.Element {
        const {
            protocolChoice,
            webviewMenuChoice,
            protocolFile,
            webviewMenuFile,
            projectName,
            projectRoot,
            projectNameErrorMsg,
            projectRootErrorMsg,
        } = this.state;

        return (
            <div id="container">
                <div id="form">
                    <Row gutter={16}>
                        <Col span={8} className="fieldTitle">Project Name:</Col>
                        <Col span={8}>
                            <Input
                                value={projectName}
                                onChange={this.handleProjectName}
                                onFocus={this.handleProjectNameFocus}
                            />
                            <div className="errMsg">{projectNameErrorMsg}</div>
                        </Col>
                    </Row>
                    <Row gutter={16} >
                        <Col span={8} className="fieldTitle">Project Parent Folder:</Col>
                        <Col span={8}>
                            <Input
                                value={projectRoot}
                                onChange={this.handleProjectRoot}
                                onFocus={this.handleProjectRootFocus}
                            />
                            <div className="errMsg">{projectRootErrorMsg}</div>
                        </Col>
                        <Col span={8}>
                            <Button onClick={this.onSelectProjectFolder}>Select</Button>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8} className="fieldTitle">Protocol Configuration File:</Col>
                        <Col span={8}>
                            <Radio.Group value={protocolChoice} onChange={this.handleProtocolChoice}>
                                <Radio
                                    className="radio"
                                    value={1}
                                    ref={this.protocolDefaultRef}
                                >
                                    Use Default Configuration
                                </Radio>
                                <Radio
                                    className="radio"
                                    value={2}
                                    onClick={this.onSelectProtocolFile}
                                    ref={this.protocolCustomRef}
                                >
                                    Select File...
                                </Radio>
                            </Radio.Group>
                            <div>
                                {
                                    protocolFile === "default" ?
                                        "" :
                                        protocolFile
                                }
                            </div>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8} className="fieldTitle">Webview Menu Configuration File:</Col>
                        <Col span={8}>
                            <Radio.Group value={webviewMenuChoice} onChange={this.handleWebviewMenuChoice}>
                                <Radio
                                    className="radio"
                                    value={1}
                                    ref={this.webviewMenuDefaultRef}
                                >
                                    Use Default Configuration
                                </Radio>
                                <Radio
                                    className="radio"
                                    value={2}
                                    onClick={this.onSelectWebviewMenuFile}
                                    ref={this.webviewMenuCustomRef}
                                >
                                    Select File...
                                </Radio>
                            </Radio.Group>
                            <div>
                                {
                                    webviewMenuFile === "default" ?
                                        "" :
                                        webviewMenuFile
                                }
                            </div>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8} offset={8} className="buttons">
                            <Space>
                                <Button onClick={this.onConfirm}>Confirm</Button>
                                <Button onClick={this.onCancel}>Cancel</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }

}