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
const hidden = new Point(-300, -300); // a hidden point position
const sectorRadius = 320; // in drawing point unit, must be consistent with python code
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
let canvas = document.getElementById('myCanvas');
let margin = 10; // must be consistent with python code
let paperWidth = 1900;
let paperHeight = 660;
canvas.width = paperWidth;
canvas.height = paperHeight;
view.Size = [paperWidth, paperHeight];


// Side view level scaling
const sideLevelStep = paperHeight / 40; // distance between two consecutive flight levels, for 37 levels, = point / 100 feet
const verticalScale = (sideLevelStep / 100) / (1 * feet2nm * nm2point);
$('#vertical-scale').html(math.round(verticalScale).toString() + '/1');


// Drawing origins
let viewGap = 50;
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
    lateral_red: null,
    later_blue: null,
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


// Loss of separation indicator, aircraft location
let aircraftShape = 'circle';
let surroundingLos = [];
let intruderLos = cpaMarker(hidden, hidden);
let surroundingFly = [];
let intruderFly = Marker(aircraftShape, hidden, cpaThreshold / 2, color.intruder, true);
let ownshipFly = Marker(aircraftShape, hidden, cpaThreshold / 2, color.ownship, true);
for (let i = 0; i < surroundingFlight; i++) {
    surroundingLos[i] = cpaMarker(hidden, hidden, hidden);
    surroundingFly[i] = Marker(aircraftShape, hidden, cpaThreshold / 2, '', true);
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

// intruder overlay for color changing effect during vertical separation
let intruderOverlaySide = [
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.intruder,
        strokeColor: color.intruder
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.intruder,
        strokeColor: 'white',
        dashArray: lineWidth.dashArray
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.intruder,
        strokeColor: color.intruder
    })
];
let intruderOverlayTop = [
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.intruder,
        strokeColor: color.intruder
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.intruder,
        strokeColor: grayLight,
        dashArray: lineWidth.dashArray
    }),
    new Path.Line({
        segments: [hidden, hidden],
        visible: false,
        strokeWidth: lineWidth.intruder,
        strokeColor: color.intruder
    })
];


// ============================================================================================================
// RESOLUTION PATHS

let selectedAircraft = false;

// OWNSHIP Resolution Paths
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


// INTRUDER Resolution Paths
let intruderLateralResTop = new Path.Line({
    segments: [hidden, hidden, hidden],
    strokeWidth: lineWidth.intruder * 0.5,
    strokeColor: color.intruder,
    dashArray: lineWidth.resDashArray,
    visible: false
});
let intruderLateralResSide = new Group([
    new Path.Line({
        segments: [hidden, hidden, hidden],
        strokeWidth: lineWidth.intruder,
        strokeColor: color.intruder,
    }),
    new Path.Circle({
        center: hidden,
        radius: 5,
        fillColor: color.intruder,
    })
]);
let intruderVerticalResTop = new Path.Line({
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
    size: [sideViewWidth + viewGap, paperHeight],
    fillColor: 'white',
    strokeColor: '',
    strokeWidth: 0,
    visible: false
});


// Reorder (z position) all graphical elements
ownshipSide.bringToFront();
ownshipTop.bringToFront();
ownshipOverlaySide[1].bringToFront();
ownshipOverlaySide[2].bringToFront();
ownshipOverlayTop[1].bringToFront();
ownshipOverlayTop[2].bringToFront();
sideVerticalLine.bringToFront();
sideHandle1.bringToFront(); // prioritized
sideHandle2.bringToFront(); // prioritized
surroundingLos.map(function (element) {
    element.bringToFront();
})
intruderLos.bringToFront();
topViewCover.bringToFront();
sideVerticalLine.bringToFront();
sideViewCover.bringToFront();


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

