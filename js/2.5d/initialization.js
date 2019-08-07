// ===============================================================
// Global setting storage:
let setting = {
    show_good_cpa: $('#show_good_cpa').is(':checked'),
    show_res_history: $('#show_res_history').is(':checked'),
    show_potential_los: $('#show_potential_los').is(':checked')
};

// // List of all settings
// let syncPointVisible;
// let feedbackVisible;
// let autoplayConflict;
// let autoplayResolution;
// let playSpeed;
// let timeLimit;
// let scenarioPerBreak;
// let breakTime;
// let restTime;
let showGoodCpa;
let showResolutionHistory;
let showPotentialLos;
let showConflictIndicator;

let demo_id;
let all_simple_res = {
    "demo_id" : demo_id,
    "data" : []
}

// Read setting
function ReadSetting() {
    showGoodCpa = setting.show_good_cpa;
    showResolutionHistory = setting.show_res_history;
    showPotentialLos = setting.show_potential_los;
}
ReadSetting();


// ====================================
// Initialize visual tool and letiables
// and setup drawing space
let vs = new VISUALTOOL();

// ==========================================================================
// Important physical interface global parameters
const pi = math.pi;
const hidden = new Point(0, 0); // a hidden point position
const sectorRadius = 330; // in drawing point unit, must be consistent with python code
const nm2point = sectorRadius / 50; // Radius of the circular sector is 50 NM, equivelant to sectorRadius in drawing screen point
const point2nm = 1 / nm2point;
const nm2feet = 6076.12;
const feet2nm = 1 / nm2feet;
const cpaThreshold = 5 * nm2point; // in drawing point unit
const verticalThreshold = 1000 * feet2nm * nm2point; // vertical separation threshold 
const commonSpeed = 600 / 3600 * nm2point; // speed in unit point per second, 450 nm per hour
const defaultHandleDistanceX = 20; // initialized distance between two handle for vertical separation
let handleDistanceX = defaultHandleDistanceX;


// Paper setup
let canvas = $('#myCanvas');
let margin = 0; // must be consistent with python code
let paperWidth = 1200;
let paperHeight = 660;
canvas.width = paperWidth;
canvas.height = paperHeight;
view.Size = [paperWidth, paperHeight];


// Side view level scaling
const sideLevelStep = paperHeight / 40; // distance between two consecutive flight levels, for 37 levels, = point / 100 feet
const verticalScale = (sideLevelStep / 100) / (1 * feet2nm * nm2point);
$('#vertical-scale').html(math.round(verticalScale).toString() + '/1');


// Drawing origins
let viewGap = 10;
let topViewOrigin = new Point(0, 0); // coords (0, 0) as seen in the normal scientific graph coordinates (Y-axis points up)
let topViewWidth = paperHeight;
let sideViewOrigin = new Point(topViewOrigin.x + topViewWidth + viewGap, 2 * margin); // as seen in the normal scientific graph coordinates (Y-axis points up)
let sideViewWidth = paperWidth - topViewWidth - viewGap;
// Mark topleft and bottomright of the drawing area
let topleft = vs.PointMarker(new Point(0, 0), 5, black);
let bottomright = vs.PointMarker(new Point(view.Size), 5, black);

// METHOD TO FLIP Y-AXIS TO POINT IT UP
let flipY = true;
// Convert coordinates as Y-axis in canvas is pointing down!!!:
Number.prototype.transX = function (x) {
    if (arguments.length == 1) {
        return topViewOrigin.x + x
    } else {
        return topViewOrigin.x + this
    }
}
Number.prototype.transY = function (y) {
    if (arguments.length == 1) {
        return paperHeight - (topViewOrigin.y + y)
    } else {
        return paperHeight - (topViewOrigin.y + this)
    }
}


// ==========================================================================
// SHOW SECTOR MAP
// Sector center
let sectorCenter = [sectorRadius + margin, (paperHeight / 2).transY()]; // must be consistent with python code
let sectorBorder = new Path.Circle({
    center: sectorCenter,
    radius: sectorRadius,
    strokeColor: gray,
    strokeWidth: 1,
    fillColor: grayLight
});
sectorBorder.sendToBack();
let sectorLeft = view.Size[0] / 2 - 350;
let sectorRight = sectorLeft + 2 * sectorRadius;


// DEFINITION OF MARKERS
function Marker(shape, position = new Point(0, 0), size, color, width, visible) {
    if (shape === 'cross') {
        return new Group([
            new Path.Line({
                from: position.add(size, size),
                to: position.add(-size, -size),
                strokeWidth: width,
                strokeColor: color,
                visible: visible
            }),
            new Path.Line({
                from: position.add(size, -size),
                to: position.add(-size, size),
                strokeWidth: width,
                strokeColor: color,
                visible: visible
            })
        ])
    }
    if (shape === 'triangle') {
        let point1 = new Point({
            length: size,
            angle: 30
        });
        let point2 = new Point({
            length: size,
            angle: 150
        });
        let point3 = new Point({
            length: size,
            angle: 270
        });
        return new Group([
            new Path.Line({
                segments: [point1, point2],
                strokeWidth: width,
                strokeColor: color,
                visible: visible
            }),
            new Path.Line({
                segments: [point2, point3],
                strokeWidth: width,
                strokeColor: color,
                visible: visible
            }),
            new Path.Line({
                segments: [point3, point1],
                strokeWidth: width,
                strokeColor: color,
                visible: visible
            })
        ])
    }
    if (shape === 'circle') {
        return new Path.Circle({
            center: position,
            radius: size,
            strokeColor: color,
            strokeWidth: width,
            visible: visible
        })
    }
    if (shape === 'fill_circle') {
        return new Path.Circle({
            center: position,
            radius: size,
            fillColor: color,
            visible: visible
        })
    }

    if (shape === 'arrow') {
        let point1 = new Point({
            length: size * 0.6,
            angle: 0
        });
        let point2 = new Point({
            length: size * 0.6,
            angle: 120
        });
        let point3 = new Point({
            length: size * 0.6,
            angle: 240
        });
        return new Group([
            new Path.Line({
                segments: [point1, point2],
                strokeWidth: width * 2,
                strokeColor: color,
                visible: visible
            }),
            new Path.Line({
                segments: [point1, point3],
                strokeWidth: width * 2,
                strokeColor: color,
                visible: visible
            }),
            new Path.Circle({
                center: (0, 0),
                radius: size,
                strokeColor: color,
                strokeWidth: width,
                visible: visible
            })
        ])
    }
};

function cpaMarker(ownshipPointTop, intruderPointTop, intruderPointSide) {
    return new Group([
        new Path.Line({
            segments: [ownshipPointTop, intruderPointTop],
            strokeColor: red,
            strokeWidth: 2
        }), // cpa closure segment on top view        
        new Path.Circle({
            center: ownshipPointTop.add(intruderPointTop).divide(2),
            radius: cpaThreshold / 2,
            strokeColor: red,
            strokeWidth: 2
        }), // cpa threshold circle on top view
        Marker('cross', intruderPointSide, 8, red, 4, true), // marker of CURRENT ACTUAL LOS on side view
        Marker('fill_circle', intruderPointSide, 5, black, 3, true) // marker of POTENTIAL LOS if ownship moves vertically closer 
    ])
}


// ==========================================================================
// VERTICAL GRID SHOWING FLIGHT LEVELS
// Middle layer has 10 flight levels (9 distances between levels)
// Uppper and Lower layer have 15 flight levels (14 distances between levels)
// ==========================================================================

let showSideView = false;

if ( showSideView ) {

    // ======================================================================
    // SHOW VERTICAL GRID
    let sideViewGrid = [];
    let importantLine = [5, 14, 23, 32];
    let levelLabel = ['FL340', 'FL350', 'FL360', 'FL370'];
    let flightLevel = [];
    // grid lines generation
    let fl = 0;
    for (let i = 0; i < 38; i++) {
        let left = [sideViewOrigin.x - 40 * importantLine.includes(i), (sideViewOrigin.y + i * sideLevelStep).transY()];
        let right = [sideViewOrigin.x + 20 * importantLine.includes(i) + sideViewWidth - lineWidth.rangeBar, (sideViewOrigin.y + i * sideLevelStep).transY()];
        sideViewGrid[i] = new Path.Line({
            segments: [left, right],
            strokeColor: new Color(0.5 - 0.5 * importantLine.includes(i)),
            strokeWidth: lineWidth.flightLevel,
            opacity: 0.7
        })
        flightLevel[i] = (sideViewOrigin.y + i * sideLevelStep).transY();
        if (importantLine.includes(i)) {
            new PointText({
                point: sideViewGrid[i].firstSegment.point.add(-10, -5),
                content: levelLabel[fl],
                fillColor: 'black',
                fontFamily: 'Inconsolata',
                fontSize: 14
            });
            fl += 1;
        }
    }


    // vertical range indicators
    let lowerRangeIndicator = new Path.Line({
        from: [sideViewOrigin.x + sideViewWidth, (sideViewOrigin.y + sideLevelStep * 0).transY()],
        to: [sideViewOrigin.x + sideViewWidth, (sideViewOrigin.y + sideLevelStep * 14).transY()],
        strokeColor: color.lower,
        strokeWidth: lineWidth.rangeBar
    });
    let middleRangeIndicator = new Path.Line({
        from: [sideViewOrigin.x + sideViewWidth, (sideViewOrigin.y + sideLevelStep * 14).transY()],
        to: [sideViewOrigin.x + sideViewWidth, (sideViewOrigin.y + sideLevelStep * 23).transY()],
        strokeColor: color.middle,
        strokeWidth: lineWidth.rangeBar
    });
    let upperRangeIndicator = new Path.Line({
        from: [sideViewOrigin.x + sideViewWidth, (sideViewOrigin.y + sideLevelStep * 23).transY()],
        to: [sideViewOrigin.x + sideViewWidth, (sideViewOrigin.y + sideLevelStep * 37).transY()],
        strokeColor: color.upper,
        strokeWidth: lineWidth.rangeBar
    });

    // Side position match line
    let sideVerticalLine = new Group([
        new Path.Line({
            segments: [
                [0, 0],
                [0, view.Size[1]]
            ],
            strokeColor: black,
            strokeWidth: 0.7
        }),
        new PointText({
            point: [-150, 20],
            content: ('00 sec').padStart(13, ' '),
            fillColor: blue,
            fontFamily: 'Inconsolata',
            // fontWeight: 'bold',
            fontSize: 22
        })
    ]);
    sideVerticalLine.pivot = sideVerticalLine.children[0].firstSegment.point;
    sideVerticalLine.position.x = sideViewOrigin.x;
}




// ===============================================================================
// SCENARIOS DATA STORAGE
let demoMode = null;
let currentDBName;
let allScen; // all scenarios
let currentScenario; // store imported data of current scenario
let currentScenarioId = 0; // current scenario id = scenario index in database + 1
let allResolution = [];
let currentResolution = {
    scenario_id: null,
    lateral: null,
    vertical: null,
    final_res: null
};
let upperFlight = 3;
let middleFLight = 1;
let lowerFlight = 3;
let surroundingFlight = upperFlight + middleFLight + lowerFlight;
let colorArr = [];
for (let i = 0; i < lowerFlight; i++) {
    colorArr.push(color.lower);
};
for (let i = 0; i < middleFLight; i++) {
    colorArr.push(color.middle);
};
for (let i = 0; i < upperFlight; i++) {
    colorArr.push(color.upper);
};
let srdLevel = []; // original flight levels of surrounding flights
let srdLevelSafe = []; // this is for conditional lateral LOS check
let srdPointLevel = [] // surrounding flight level in drawing point, for using in lateral LOS check
let intruderLevel; // the original flight level of intruder
let ownshipLevel; // the original flight level of ownship
let intruderPointLevel;
let ownshipPointLevel;
let ownshipNewPointLevel;
let climbRate = $('#climb-rate').val() / 60; // feet per second


// Flow control variables
let verticalSeparation = false;
let lateralSeparation = false;
let performingLateralSeparation = false;
let lockLineWidth = false;
let hasLateralRes = false;
let hasVerticalRes = false;
let finalRes = '';


// Loss of Separation Indicator and Aircraft Location
let aircraftShape = 'arrow';
let surroundingLos = [];
let intruderLos = cpaMarker(hidden, hidden);
let surroundingFly = [];
let intruderFly = Marker(aircraftShape, hidden, cpaThreshold / 2, color.intruder, lineWidth.flyMarker, true);
let ownshipFly = Marker(aircraftShape, hidden, cpaThreshold / 2, color.ownship, lineWidth.flyMarker, true);
intruderFly.applyMatrix = false;
ownshipFly.applyMatrix = false;
for (let i = 0; i < surroundingFlight; i++) {
    surroundingLos[i] = cpaMarker(hidden, hidden, hidden);
    surroundingFly[i] = Marker(aircraftShape, hidden, cpaThreshold / 2, color.surrounding, lineWidth.flyMarker, true);
    surroundingFly[i].applyMatrix = false;
}


// ============================================================================================================
// ORIGINAL FLIGHT PATHS
// Surrounding flights in three airspace layers
// Top view
let srdFlightTop = [
    // idx 0->2: lower        
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.topView,
        strokeColor: color.lower
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.topView,
        strokeColor: color.lower
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.topView,
        strokeColor: color.lower
    }),
    // idx 3: middle
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.topView,
        strokeColor: color.middle
    }),
    // idx 4->6: upper layer
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.topView,
        strokeColor: color.upper
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.topView,
        strokeColor: color.upper
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.topView,
        strokeColor: color.upper
    })
];

// heading of the flight top view
// this is fixed
let srdFlightHeading;
let intruderFlightHeading;
let ownshipFlightHeading;
let resFlightHeading;

// Side view
let srdFlightSide = [
    // idx 0->2: lower layer   
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.sideView,
        strokeColor: color.lower
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.sideView,
        strokeColor: color.lower
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.sideView,
        strokeColor: color.lower
    }),
    // idx 3: middle layer
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.sideView,
        strokeColor: color.middle
    }),
    // idx 4->6: upper layer
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.sideView,
        strokeColor: color.upper
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.sideView,
        strokeColor: color.upper
    }),
    new Path.Line({
        segments: [hidden, hidden],
        strokeWidth: lineWidth.sideView,
        strokeColor: color.upper
    })
];


// ================================================================
// Conflict flights: INTRUDER AND OWNSHIP in top view and side view
// Ownship; idx 0 in conflict_pair array in data
let ownshipTop = new Path.Line({
    segments: [hidden, hidden],
    strokeWidth: lineWidth.ownship,
    strokeColor: color.ownship
});
let ownshipSide = new Path.Line({
    segments: [hidden, hidden],
    strokeWidth: lineWidth.ownship,
    strokeColor: color.ownship
});

// Intruder; idx 1 in conflict_pair array in data
let intruderTop = new Path.Line({
    segments: [hidden, hidden],
    strokeWidth: lineWidth.intruder,
    strokeColor: color.intruder
});
let intruderSide = new Path.Line({
    segments: [hidden, hidden],
    strokeWidth: lineWidth.intruder,
    strokeColor: color.intruder
});

// Ownship overlay for color changing effect during vertical separation
let ownshipOverlaySide = [
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.ownship,
        strokeColor: color.ownship
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.ownship,
        strokeColor: 'white',
        dashArray: lineWidth.dashArray
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.ownship,
        strokeColor: color.ownship
    })
];
let ownshipOverlayTop = [
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.ownship,
        strokeColor: color.ownship
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.ownship,
        strokeColor: grayLight,
        dashArray: lineWidth.dashArray
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.ownship,
        strokeColor: color.ownship
    })
];


// ============================================================================================================
// RESOLUTION PATHS
// Lateral resolution
let ownshipLateralResTop = new Path.Line({
    segments: [hidden, hidden, hidden],
    strokeWidth: lineWidth.ownship * 0.5,
    strokeColor: color.ownship,
    dashArray: lineWidth.resDashArray,
    visible: false
});
let ownshipLateralResSide = new Group([
    new Path.Line({
        segments: [hidden, hidden, hidden],
        strokeWidth: lineWidth.ownship,
        strokeColor: color.ownship,
    }),
    new Path.Circle({
        center: hidden,
        radius: 5,
        fillColor: color.ownship,
    })
]);
let ownshipVerticalResTop = new Path.Line({
    segments: [hidden, hidden, hidden, hidden],
    visible: false
});

// Vertical resolution
let sideHandle1 = new Path.Circle({
    center: hidden,
    radius: 8,
    fillColor: gray,
    strokeColor: black,
    strokeWidth: 2,
    visible: true
});
let sideHandle2 = new Path.Circle({
    center: hidden,
    radius: 8,
    fillColor: gray,
    strokeColor: black,
    strokeWidth: 2,
    visible: true
});

// Entry markers
let srdEntryMarkerTop = [];
let srdEntryMarkerSide = [];
let colorArr1 = [
    color.lower, color.lower, color.lower,
    color.middle,
    color.upper, color.upper, color.upper
];
for (let i = 0; i < surroundingFlight; i++) {
    srdEntryMarkerTop[i] = vs.PointMarker(hidden, pointSize.entry, colorArr1[i], true);
    srdEntryMarkerSide[i] = vs.PointMarker(hidden, pointSize.entry, colorArr1[i], true);
}
let intruderEntryMarkerTop = vs.PointMarker(hidden, pointSize.entry, color.intruder, true);
let intruderEntryMarkerSide = vs.PointMarker(hidden, pointSize.entry, color.intruder, true);
let ownshipEntryMarkerTop = vs.PointMarker(hidden, pointSize.entry + 1, color.ownship, true);
let ownshipEntryMarkerSide = vs.PointMarker(hidden, pointSize.entry, color.ownship, true);

let topFinishLevelChange = [];
let topStartLevelChange = [];
for (let i = 0; i < surroundingFlight; i++) {
    topStartLevelChange[i] = Marker('triangle', new Point(0, 0), markerSize, markerColor, markerWidth, true);
    topFinishLevelChange[i] = Marker('cross', new Point(0, 0), markerSize, markerColor, markerWidth, true);
}




// Link between views
let viewLink = [];
for (let i = 0; i < surroundingFlight; i++) {
    viewLink[i] = new Group([
        new Path.Line({
            segments: [hidden, hidden],
            strokeColor: black,
            strokeWidth: 1,
            visible: true,
            dashArray: lineWidth.dashArray
        }),
        new PointText({
            point: hidden,
            content: '',
            fillColor: 'black',
            fontFamily: 'Inconsolata',
            visible: true,
            fontSize: 16
        })
    ]);
}


// View covers
let topViewCover = new Path.Rectangle({
    point: [0, 0],
    size: [topViewWidth, paperHeight],
    fillColor: 'white',
    strokeColor: '',
    strokeWidth: 0,
    visible: false
});

let sideViewCover = new Path.Rectangle({
    point: [topViewWidth, 0],
    size: [sideViewWidth + viewGap + 10, paperHeight + 10],
    fillColor: 'white',
    strokeColor: '',
    strokeWidth: 0,
    visible: true
});

let lateralTopLeftCover = new Path.Rectangle({
    point: [0, 0],
    size: [50, 50],
    fillColor: 'white',
    strokeColor: '',
    strokeWidth: 0,
    visible: true
})






// Reorder (z position) all graphical elements
ownshipSide.bringToFront();
ownshipTop.bringToFront();
ownshipOverlaySide[1].bringToFront();
ownshipOverlaySide[2].bringToFront();
ownshipOverlayTop[1].bringToFront();
ownshipOverlayTop[2].bringToFront();
// sideVerticalLine.bringToFront();
sideHandle1.bringToFront(); // prioritized
sideHandle2.bringToFront(); // prioritized
surroundingLos.map(function (element) {
    element.bringToFront();
})
intruderLos.bringToFront();
topViewCover.bringToFront();
// sideVerticalLine.bringToFront();
sideViewCover.bringToFront();
// lateralBottomRightCover.bringToFront();
lateralTopLeftCover.bringToFront();


// =======================================
// Initialize 3D plot space
let spaceSector = document.getElementById('space-sector');


// =======================================
// Function to get/update current settings
// function UpdateSetting() {
//     $.ajax({
//         url: '/setting?action=read',
//         async: true,
//         success: function (result) {
//             let setting = JSON.parse(result);
//             Object.keys(setting).map(function(key) {
//                 let element = $('#' + key);         
//                 if (element.is(':checkbox')) {
//                     element.prop('checked', setting[key] == 1);
//                 } 
//                 else {
//                     element.val(setting[key]);
//                 }
//             });
//             syncPointVisible = setting.sync_point;
//             feedbackVisible = setting.show_score;
//             autoplayConflict = setting.autoplay_conflict;
//             autoplayResolution = setting.autoplay_resolution;
//             playSpeed = parseFloat(setting.play_speed);
//             timeLimit = parseInt(setting.scen_time);
//             scenarioPerBreak = parseInt(setting.scen_per_break);
//             breakTime = parseInt(setting.break_time);
//             restTime = parseInt(setting.rest_time);
//             showGoodCpa = setting.show_good_cpa;
//             showResolutionHistory = setting.show_res_history;
//             showPotentialLos = setting.show_potential_los;
//             $('#input-file').prop('disabled', false);
//             console.log('Setting read done: ', setting);
//         }	 
//     })
// }

// UpdateSetting();

// global vars for auto play resolution
let aircraftAutoPosition = 0;
let resolutionIsRunning = false;
let resolutionPlayingPaused = false;
let autoResolutionPlayer; // this will be assigned to setInterval()

// global var for enable/disable vertical dimension
let levelAllFlight = true; // set this to true to disable vertical dimension


// Visual info about the current resolution

vs.InfoLayer.activate();

let box_origin = new Point(850, 100);
let box_height = 220;
let box_width = 250;
let five_mn_level = box_origin.y + box_height - 44;
let color_jupm = 2.5;

let separation_box= new Path.Rectangle({
    point: box_origin,
    size: [box_width, box_height],
    fillColor: 'white',
    strokeColor: 'gray',
    strokeWidth: 0.5,
    visible: true
})

let label_scale = 1.5;
let title_scale = 2;

var text1 = new PointText(box_origin.add(2, box_height + 60));
text1.justification = 'center';
text1.fillColor = 'black';
text1.content = 'Against Intruder';
text1.scaling = 1.2;
text1.rotation = -45;
text1.scaling = label_scale;

var text2 = new PointText(box_origin.add(45, box_height + 78));
text2.justification = 'center';
text2.fillColor = 'black';
text2.content = 'Against SRD Aircraft 1';
text2.scaling = 1.2;
text2.rotation = -45;
text2.scaling = label_scale;

var text3 = new PointText(box_origin.add(105, box_height + 78));
text3.justification = 'center';
text3.fillColor = 'black';
text3.content = 'Against SRD Aircraft 2';
text3.scaling = 1.2;
text3.rotation = -45;
text3.scaling = label_scale;

var text4 = new PointText(box_origin.add(165, box_height + 78));
text4.justification = 'center';
text4.fillColor = 'black';
text4.content = 'Against SRD Aircraft 3';
text4.scaling = 1.2;
text4.rotation = -45;
text4.scaling = label_scale;

var text5 = new PointText(box_origin.add(box_width/2, -20));
text5.justification = 'center';
text5.fillColor = 'black';
text5.content = 'SEPARATION INDICATORS';
text5.scaling = title_scale;

var text6 = new PointText(box_origin.add(box_width/2, 420));
text6.justification = 'center';
text6.fillColor = 'black';
text6.content = 'MANEUVER DEVIATION';
text6.scaling = title_scale;

let cpa_line = new Path.Line({
    segments: [[box_origin.x, five_mn_level], [box_origin.x + box_width, five_mn_level]],
    strokeColor: black,
    strokeWidth: 2,
    visible: true, 
})

let los_box = [];

for ( i=0; i<4; i++) {
    los_box[i] = new Path.Rectangle({
        point: box_origin.add(i*60+10, 0),
        size: [50, box_height],
        fillColor: { hue: 360, saturation: 1, lightness: 0.5 },
        strokeColor: '',
        strokeWidth: 0,
        visible: true,
    })
}

os_dev = new Path.Rectangle({
    point: box_origin.add(0, 450),
    size: [100, 50],
    fillColor: { hue: 200, saturation: 1, lightness: 0.5 },
    strokeColor: '',
    strokeWidth: 0,
    visible: true,
})

os_dev_text = new PointText(
    os_dev.segments[2].point.x + 30,
    (os_dev.segments[0].point.y + os_dev.segments[1].point.y) / 2 + 5,
);
os_dev_text.justification = 'center';
os_dev_text.fillColor = 'black';
os_dev_text.content = '1';
os_dev_text.scaling = label_scale;

cpa_line.bringToFront();

var visual_indicator_cover = new Path.Rectangle({
    point: box_origin.add(-50, -40),
    size: [box_width + 100, box_height + 350],
    fillColor: 'white',
    strokeColor: '',
    strokeWidth: 0,
    visible: false
})


