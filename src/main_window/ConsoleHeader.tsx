import React from 'react';

import '../assets/css/main_window/ConsoleHeader.css';

export interface ConsoleHeaderProps {
    tabNames: Array<string>;
    defaultInd: number;
    handleTabChange: (key: number) => void;
}

interface PosInfo {
    left: number;
    width: number;
}

export class ConsoleHeader extends React.Component<ConsoleHeaderProps, {}> {

    private tabPos: Array<PosInfo>;
    private bar: HTMLElement;

    constructor(props: ConsoleHeaderProps) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event: any): void {
        const span = event.target as HTMLElement;
        document.querySelector(".focusedTab").classList.remove("focusedTab");
        span.classList.add("focusedTab");

        const ind = +(span as HTMLElement).dataset.ind;
        this.updateBar(this.tabPos[ind].left, this.tabPos[ind].width); 

        this.props.handleTabChange(ind);
    }

    componentDidMount(): void {
        const container = document.getElementById("consoleHeaderContainer");
        const containerRect = container.getBoundingClientRect();
        this.tabPos = [];
        const ind = this.props.defaultInd;
        for (const span of container.children) {
            const rect = span.getBoundingClientRect();
            this.tabPos.push({
                left: rect.left - containerRect.left,
                width: rect.width
            });

            if (+(span as HTMLElement).dataset.ind === ind) {
                span.classList.add("focusedTab");
            }
        }

        this.bar = document.getElementById("consoleHeaderBar");
        this.updateBar(this.tabPos[ind].left, this.tabPos[ind].width);
    }

    updateBar(left: number, width: number): void {
        this.bar.style.left = left + "px";
        this.bar.style.width = width + "px";
    }

    render(): JSX.Element {
        const { tabNames } = this.props;

        return (
            <div id="consoleHeaderContainer">
                {
                    tabNames.map((item, index) => {
                        return (
                            <span key={index} onClick={this.handleClick} data-ind={index}>
                                {item}
                            </span>
                        );
                    })
                }
                <div id="consoleHeaderBar"></div>
            </div>
        );
    }
}