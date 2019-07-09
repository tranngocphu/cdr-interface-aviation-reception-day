'use strict';

// color definition
const
    red = 'red',
    blue = 'blue',
    green = 'green',
    black = 'black',
    orange = '#f98e36',
    orangeLight = '#fcab55',
    violet = '#a830ff',
    pink = '#ff14b0',
    pinkLight = '#ff89d7',
    gray = '#a5a5a5',
    grayLight = '#e2e2e2',
    yellow = '#c6b300',
    yellowLight = '#ffffc6',
    redLight = '#ff5b5b',
    maroon = '#840000',
    airspaceColor = '#575757';


// Colors and line width assignment
const color = {
    intruder: red,
    ownship: blue,
    lower: gray,
    middle: gray,
    upper: gray
};

const lineWidth = {
    topView: 1.5,
    sideView: 2,
    rangeBar: 8,
    flightLevel: 0.5,
    ownship: 5,
    intruder: 5,
    dashArray: [8, 8],
    resDashArray: [15, 5]
};

const pointSize = {
    syncPoint: 6,
    entry: 7
}

const markerSize = 7;
const markerColor = red;
const markerWidth = 2;