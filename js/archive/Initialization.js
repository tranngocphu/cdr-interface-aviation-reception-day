"use strict"; // Strict mode: ALL VARIABLES MUST BE EXPLICITLY DECLARED
var debugMode   = true;
var exploreMode = false;
var eegMode     = true;
var timing      = false;

function checkEEGMode() {
    if (eegMode) {
        var allowPathChange = false; // set this to TRUE to skip situation awareness
        $('#eeg-section').show();
        timing = true;
    } else {
        var allowPathChange = true;
        $('#eeg-section').hide();
        timing = false;
    }
}
checkEEGMode();

var subjectName;
var sessionId;
var autoNext = false;
var fileName; // write resolution to this csv file, will be defined in function InitializeNewCSVFile();
var writeHeader;
var onTime = false;

var loadLocalSetting = false;

var server = 'ws://172.21.129.22:8881/ws';
var trigger = true;
// trigger list:
var ShowScen          = 1;
var AwarenessDecision = 2;
var StartDragging     = 4;
var FinalDecision     = 5;

const
    red = 'red',
    blue = 'blue',
    green = 'green',
    black = 'black',
    orange = '#f98e36',
    violet = '#a830ff',
    pink = '#ff14b0',
    gray = '#666666',
    yellow = '#c6b300',
    yellowLight = '#fffb87',
    redLight = '#ff5b5b',
    maroon = '#840000';
const pi = math.pi;
const hidden = [-100, -100];

//============================================
var isCreatingDatabase = true;


var n = 2; // max of flights involved in a conflict
var numOfPair = 0;
for (var i = 0; i < n; i++) {
    numOfPair += i;
}
var liveCpaIdx = [];
var flightPair = [];
var dataRecording;
var selectedIdx = null;
var animating;
var subjectName;
var recentScore = [-1, -1, -1]; // negative means there's no score data
var currentScore;
Array.prototype.getScoreString = function () {
    var scoreString = '[';
    for (var i = 2; i >= 0; i--) {
        if (this[i]) {
            scoreString += this[i].toString() + ' ';
        }
    }
    scoreString = scoreString.slice(0, -1);
    scoreString += ']';
    return scoreString;
};
var scenarioCount = 0;
var scenarioPerBreak;
var breakTime;
var restTime;
var timeLimit;
var playSpeed;
var scenarioSource;
var losVisible = true;
var cpaVisible = true;
var syncPointVisible;
var feedbackVisible;
var autoplayConflict;
var autoplayResolution;
var originalConflict;

var setting = null;
$('#input-file').prop('disabled', true);

function UpdateSetting() {
    $.ajax({
        url: '/setting?action=read',
        async: true,
        success: function (result) {
            setting = JSON.parse(result);
            Object.keys(setting).map(function(key) {
                var element = $('#' + key);         
                if (element.is(':checkbox')) {
                    element.prop('checked', setting[key] == 1);
                } 
                else {
                    element.val(setting[key]);
                }
            });
            syncPointVisible = setting.sync_point;
            feedbackVisible = setting.show_score;
            autoplayConflict = setting.autoplay_conflict;
            autoplayResolution = setting.autoplay_resolution;
            playSpeed = parseFloat(setting.play_speed);
            timeLimit = parseInt(setting.scen_time);
            scenarioPerBreak = parseInt(setting.scen_per_break);
            breakTime = parseInt(setting.break_time);
            restTime = parseInt(setting.rest_time);
            $('#input-file').prop('disabled', false);
            console.log('Setting read done: ', setting);
        }	 
    })
}

try {
    UpdateSetting();
}
catch(err) {
    loadLocalSetting = true;
}


var scenarioId;
var intermediateResolutionCount = 0;
var scenResolution = new Array();
var scenConflictDB = new Array();
var generationCounter;

// Arrows parameters
var headLength = 20;
var headAngle = 165;
var arrowColor = red;
var arrow = [null, null];
var initialSpeed = 100;
var speedAdjust = 1;

// Variables for storing scenario
var scenario;

// Variable of current scenario
var mouseDisabled = new Array(10);
mouseDisabled.fill(false);
var currentSyncOffset;
var currentConflict = new CONFLICT();
var currentResolution;   

// Setting up the visual tool and view
var vs = new VISUALTOOL(); // This instance must be named "vs", for "vs" is called in other class definition
const paperOrigin = vs.PointMarker(new Point(0, 0), vs.ThickerStroke, black);
view.Size = [750, 750];
// view.autoUpdate = false;
var mySector = new SECTOR(); // This instance must be named "mySector", for "mySector" is called in other class definition	
vs.Origin = view.center;
mySector.Origin = {
    x: view.center.x,
    y: view.center.y
};
mySector.MapScale = (vs.ViewSize / 2) / mySector.SectorSize;

// Common airspace constants 
const mapAircraftSpeed = vs.Real2Map(mySector.AircraftSpeed) / 3600; // point per second
const mapMinCPA = vs.Real2Map(mySector.MinCPA);
const mapSectorSize = vs.Real2Map(mySector.SectorSize);

// ON-SCREEN GRAPHICAL FLIGHT PATHS AND ENTRY MARKER. DO NOT DELETE THIS PART
var colorArr = [blue, green, orange, violet, pink,
                gray, yellow, maroon, black, red,
                blue, green, orange, violet, pink, 
                gray, yellow, maroon, black, red,
                blue, green, orange, violet, pink];

var oriPath = new Array(n);
var modPath = new Array(n);
var entryMarker = new Array(n);
var midPoint = new Array(n);
var distance2LosCircle = new Array(n);
var oriPath, modPath;
vs.ObjLayer.activate();
for (var i=0; i<n; i++) {
    oriPath[i] = new FLIGHT(vs.FlightStroke, colorArr[i], i, 'ori');
    modPath[i] = new FLIGHT(vs.FlightStroke, colorArr[i], i, 'mod');
    // midPoint[i] = vs.EntryMarker(hidden, vs.AircraftSize, colorArr[i], true);
    entryMarker[i] = vs.EntryMarker(hidden, vs.AircraftSize, colorArr[i], true);
    entryMarker[i].EntryTime = 10000;
    entryMarker[i].Idx = i;
    entryMarker[i].onMouseEnter = function () {
        this.fillColor = this.strokeColor;
    }
    entryMarker[i].onMouseLeave = function () {
        this.fillColor = null;
    }
    entryMarker[i].onClick = function () {
        if (Key.modifiers.control) {
            console.log('Selected flight idx: ', this.Idx);
        } else {
            modPath[this.Idx].Path.segments = oriPath[this.Idx].Path.segments;
            modPath[this.Idx].Path.visible = false;
            scenario.ModifiedFlight[this.Idx].IsModified = false;
            scenario.ModifiedFlight[this.Idx].AddedPoint = null;
            if (debugMode) {
                console.log(scenario.ModifiedFlight);
            }
            var i = this.Idx;
            for (var j = 0; j < n; j++) {
                var k;
                if (j != i) {
                    if (i < j) {
                        k = liveCpaIdx[i][j];
                    } else {
                        k = liveCpaIdx[j][i];
                    }
                    LiveSegmentCPA(modPath[i], modPath[j], k);
                }
            }
        }
    }
}

// ON-SCREEN FEEDBACK GRAPHICAL ELEMENTS
vs.IndLayer.activate();
vs.IndLayer.removeChildren();
var syncPoint = new Path.Circle({
    center: hidden,
    radius: vs.FlightStroke + 2,
    fillColor: gray,
    visible: syncPointVisible    
})
var timeIndicator = new PointText({
    point: [600, 30],
    content: 'Please rest: 10s',
    fillColor: black,
    fontFamily: 'Inconsolata',
    fontWeight: 'bold',
    fontSize: 16,
    visible: false
});
var currentClosure = new PointText({
    point: [10, 15],
    fillColor: green,
    fontFamily: 'Inconsolata',
    fontWeight: 'bold',
    fontSize: 16,
    visible: false
});
// var recentScores = new PointText({
//     point: [10, 35],
//     content: 'Recent scores: ' + recentScoresArr.join('  '),
//     fillColor: black,
//     fontFamily: 'Inconsolata',
//     fontWeight: 'bold',
//     fontSize: 16,
//     visible: false
// });
// var currentScore = new PointText({
//     point: [10, 55],
//     content: 'This score: 90',
//     fillColor: blue,
//     fontFamily: 'Inconsolata',
//     fontWeight: 'bold',
//     fontSize: 16,
//     visible: false
// });
var cpaLine = new Array(numOfPair);
var cpaCircle = new Array(numOfPair);
for (var i = 0; i < numOfPair; i++) {
    cpaLine[i] = new Path.Line({
        strokeWidth: 4,
        strokeColor: red,
        visible: false
    })
    cpaCircle[i] = new Path.Circle({
        center: hidden,
        radius: mapMinCPA / 2,
        strokeWidth: 4,
        strokeColor: red,
        visible: false
    })
}
var cpaLineExtension = new Path.Line({
    segments: [hidden, hidden],
    strokeWidth: 1,
    strokeColor: redLight,
    visible: exploreMode
})

var midEntryRefPoint = new Path.Circle({
    center: hidden,
    radius: 6,
    fillColor: gray,    
    visible: exploreMode
})

var resolutionGuideLine = new Path.Line({
    segments: [hidden, hidden],
    strokeWidth: 1,
    strokeColor: green,
    visible: exploreMode
})

var resolutionGuideCircle = null;

// ANIMATION GRAPHICAL ELEMENTS
vs.AniLayer.activate();
var aircraft = new Array(n);
for (var i = 0; i < n; i++) {
    aircraft[i] = new Path.Circle({
        center: hidden,
        radius: vs.AircraftSize,
        fillColor: colorArr[i],
        visible: false
    })
}

var beginMarker1 = [
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: red,
        visible: exploreMode
    }),
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: red,
        visible: exploreMode
    })
];

var beginMarker2 = [
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: orange,
        visible: exploreMode
    }),
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: orange,
        visible: exploreMode
    })
];

var beginMarker3 = [
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: yellow,
        visible: exploreMode
    }),
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: yellow,
        visible: exploreMode
    })
];

var beginMarker4 = [
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: pink,
        visible: exploreMode
    }),
    new Path.Circle({
        center: hidden,
        radius: 9,
        fillColor: pink,
        visible: exploreMode
    })
];


