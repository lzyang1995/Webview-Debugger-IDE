import React from 'react';

export function getElementStyle(
    dimension: "height" | "width",
    elementSize: number,
    gutterSize: number
): object {
    return {
        'flex-basis': `calc(${elementSize}% - ${gutterSize}px)`
    };
}

export function getGutterStyle(
    dimension: "height" | "width",
    gutterSize: number
): object {
    return {
        'flex-basis': `${gutterSize}px`
    }
}



