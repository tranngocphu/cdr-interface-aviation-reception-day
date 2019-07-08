// =========================================================
// BUTTONS AND DOM FUNCTIONS
// =========================================================
var time2Next;
var timeLeft;
var generateBtnDisabled = true;
var allScen;
var currentScenId;

$('#input-file').change(function() {
    $('#start-id').val('');
    $('#current-id').val('');
    $('#total-scen').val(0);
    fileName = $('#input-file')[0].files[0].name;
    $.ajax({
        url: '/scenario?action=pick&filename=' + fileName,
        async: true,
        success: function (result) {
            allScen = JSON.parse(result);            
        },
        complete: function () {
            $('#total-scen').val(allScen.length);            
        }
    })
})  


$('#source-id').change(function() {
    $('#start-id').val('');
    $('#current-id').val('');
    $('#total-scen').val(0);
    var source_id = $('#source-id').val().toString().padStart(2,'0');
    fileName = 'conflict_scenario_' + source_id + '.csv';
    $.ajax({
        url: '/scenario?action=pick&filename=' + fileName,
        async: true,
        success: function (result) {
            allScen = JSON.parse(result);            
        },
        complete: function () {
            $('#total-scen').val(allScen.length);            
        }
    })
}) 


$('#start-id').change(function () {
    currentScenId = $('#start-id').val();
    if (currentScenId) {
        $('#start-btn').prop('disabled', false);
        $('#current-id').val(currentScenId);
    }
})

$('#start-btn').click(function() {         
    if ( $('#subject-name').val() == '' ) {
        alert('Please input subject name and any session id.');
        return
    }
    InitializeNewCSVFile(scenario, fileName);    
    PickScenario(currentScenId);
})

$('#update-setting-btn').click(function() {
    UpdateSetting();
})

$('#next-btn').click(function () {
    $('input[name=scen-awareness]').prop('disabled', false);
    $('#is-conflict').prop('checked', false);
    $('#no-conflict').prop('checked', false);
    if (eegMode) {
        allowPathChange = false;
    }    
    if (!onTime) { 
        currentScore = 0;
        UpdateScore(); 
    }
    WriteResolutionNode(scenResolution);
    PickScenario(currentScenId);
	$('#three-angle').html('');
})

$('#reset-btn').click(function () {
    for (var i = 0; i < n; i++) {
        modPath[i].Path.segments = oriPath[i].Path.segments;
        modPath[i].Path.visible = false;
        oriPath[i].Path.visible = true;
        oriPath[i].Path.bringToFront();
        if (i > 0) {
            for (var j = 0; j < i; j++) {
                var k = liveCpaIdx[j][i];
                LiveSegmentCPA(modPath[i], modPath[j], k);
            }
        }
    }
})

$('#play-conflict-btn').click(function () {
    PlayComplex('conflict', false);
})

$('#play-resolution-btn').click(function () {
    PlayComplex('resolution', false);
})


$('input[name=scen-awareness]').change(function () {
    if (trigger) {
        SendHardTrigger(AwarenessDecision);
    }
    var response = $('input:radio[name=scen-awareness]:checked').val() == "1";
    $('input[name=scen-awareness]').prop('disabled', true);
    scenario.ModifiedPair[0].ConflictAwareness = response;
    if (originalConflict) {
        if (response) { // correct as has conflict
            allowPathChange = true;
            // show initial conflict indicator
            cpaLine.map(function (element) {
                element.visible = true;        
                return element
            })
            cpaCircle.map(function (element) {
                element.visible = true;
                return element
            })
            return
        }
        else { // incorrect 
            allowPathChange = false;
            currentScore = 0;
            UpdateScore();
        }
    }
    else {
        if (!response) { // correct as no conflict
            allowPathChange = false;
            currentScore = 100;
            UpdateScore();
        }
        else { // incorrect
            allowPathChange = false;
            currentScore = 0;
            UpdateScore();
        }
    }
    allowPathChange = true; // enable this line if data DON'T have is_conflict value
})


// $('#hide-ori-path-cb').change(function () {
//     var newStt = $('#hide-ori-path-cb').is(':checked');
//     oriPath.map(function (element) {
//         element.Path.visible = !newStt;
//         element.Path.bringToFront();
//         return element
//     })
//     if (newStt) {
//         modPath.map(function (element) {
//             element.Path.visible = newStt;
//             return element
//         })
//     }
// })

// $('#num-of-flight').keyup(function (e) {
//     if (e.keyCode == 13) {
//         $('#generate-btn').click();
//     }
// });

// $('#pick-btn').click(function() {
//     PickScenario(simpleScenStartId, 'simple_conflict');
//     $('#subject-name').val(simpleScenStartId);
//     simpleScenStartId++;
// })

// $('#speed-changer').change(function() {    
//     // $('#speed-changer').prop('disabled', true);
//     PlayComplex('resolution', false);
// }) 


function RunTimer() {
    clearInterval(timeLeft);
    clearTimeout(time2Next);
    $('#timer').html(setting.scen_time);
    $('#scen-counter').html( parseInt($('#scen-counter').html()) + 1 );
    timeLeft = setInterval("$('#timer').html( parseInt($('#timer').html()) - 1 );", 1000);
    time2Next = setTimeout("UpdateScore(); WriteResolutionNode(scenResolution); PickScenario(currentScenId);", setting.scen_time * 1000);
}


// ===================================================
// Function to create conflict for writing to database
// m: number of flights in a scenario
// k: number of scenarios
// ===================================================
function CreateConflictDB(m, k) {
    n = m;
    for (var j = 0; j < k; j++) {
        RandomizeComplexConflict();
        WriteConflictDB(scenario);
    }
}

// ======================================
// Function to reset vars before generate
// every new scenario
// ======================================
function ResetVars() {
    mouseDisabled.fill(false);
    //
    oriPath.map(function (element) {
        element.Path.segments = [];
        element.PairInvolved = [];
        return element
    })
    modPath.map(function (element) {
        element.Path.segments = [];
        element.Path.visible = false;
        element.PairInvolved = [];
        return element
    })
    syncPoint.position = hidden;
    entryMarker.map(function (element) {
        element.position = hidden;
        return element
    })
    cpaLine.map(function (element) {
        element.firstSegment.point = hidden;
        element.lastSegment.point = hidden;
        return element
    })
    cpaCircle.map(function (element) {
        element.position = hidden;
        return element
    })
    aircraft.map(function (element) {
        element.position = hidden;
        return element
    })
    cpaLineExtension.segments = [hidden, hidden];
    if (resolutionGuideCircle != null) {
        resolutionGuideCircle.remove();    
    }
    

    arrow.map(function(element) { if (element) { element.remove(); } return element });
    $('#speed-changer').val(1);
    $('#speed-ratio').html($('#speed-changer').val());
    $('#speed-changer').prop('disabled', false);

    
    // Reset num of pair and array of cpa line indeces
    numOfPair = 0;
    for (var i = 0; i < n - 1; i++) {
        liveCpaIdx[i] = [];               
        for (var j = i + 1; j < n; j++) {
            liveCpaIdx[i][j] = numOfPair;
            numOfPair++;
        }
    }
    scenResolution = [];
    currentScore = 0;

    // $('#play-conflict-btn').prop('disabled', true);
    // $('#play-resolution-btn').prop('disabled', true);
    $('#current-score').html('...');
    $('#is-conflict').prop('checked', false);
    $('#no-conflict').prop('checked', false);
    $('#is-conflict').prop('disabled', false);
    $('#no-conflict').prop('disabled', false);
}


// ========================================================================
// Function to Pick and Show a Scenario from DB received from NodeJS server
// ========================================================================
function PickScenario(id) {    
    ResetVars();
    var scen = allScen[id-1];
    oriPath[0].Path.segments = [
        new Point([scen.entry_x_0, scen.entry_y_0]),
        new Point([scen.middle_x_0, scen.middle_y_0]),
        new Point([scen.exit_x_0, scen.exit_y_0])
    ];
    oriPath[1].Path.segments = [
        new Point([scen.entry_x_1, scen.entry_y_1]),
        new Point([scen.middle_x_1, scen.middle_y_1]),
        new Point([scen.exit_x_1, scen.exit_y_1])
    ];
    
    modPath[0].Path.segments = oriPath[0].Path.segments;
    modPath[1].Path.segments = oriPath[1].Path.segments;
    
    oriPath[0].EntryTime = scen.entry_time_0;    
    modPath[0].EntryTime = scen.entry_time_0;
    
    oriPath[1].EntryTime = scen.entry_time_1;
    modPath[1].EntryTime = scen.entry_time_1;
    
    cpaVisible = setting.init_cpa;
    
    ShowCurrentConflictLine();
    PostGenerationTask();
    if (timing) {
        RunTimer();
    }
    $('#current-id').val(currentScenId);
    originalConflict = scen.is_conflict == "1";
    currentScenId++;
    if (trigger) {
        SendHardTrigger(ShowScen);
    }
}

// ======================================
// Function to show initial LOS
// ======================================
function ShowCurrentConflictLine() {
    var k = 0;
    var conflict;
    for (var i = 0; i < n - 1; i++) {
        for (var j = i + 1; j < n; j++) {
            k = liveCpaIdx[i][j];
            flightPair[k] = new ORIGINALPAIR();            
            conflict = ConflictDetector(oriPath[i], oriPath[j], k);
            SegmentCutBorderSector(conflict[3], conflict[4], cpaLineExtension);
            resolutionGuideCircle = new Path.Circle({
                center: oriPath[1].Path.firstSegment.point,
                radius: oriPath[1].Path.firstSegment.point.getDistance(conflict[3]),
                strokeColor: green,
                strokeWidth: 1,
                visible: exploreMode   
            });
            if (conflict[0]) {
                // CALCULATION OF ORIGINAL CONFLICT PROPERTIES HERE                
                flightPair[k].HasConflict = conflict[0];
                flightPair[k].Pair.early = i;
                flightPair[k].Pair.late = j;
                flightPair[k].Conflict.ShiftTime = oriPath[j].EntryTime - oriPath[i].EntryTime;
                flightPair[k].Conflict.ShiftDistance = flightPair[k].Conflict.ShiftTime * mapAircraftSpeed; 
                flightPair[k].Conflict.EntryClosure = oriPath[i].Path.firstSegment.point.getDistance(oriPath[j].Path.firstSegment.point);
                flightPair[k].Conflict.LOSLocation.angle = GetPolarCoord(cpaCircle[k].position).angle;
                flightPair[k].Conflict.LOSLocation.radius = GetPolarCoord(cpaCircle[k].position).radius;
                flightPair[k].Conflict.LOSLocation.x = cpaCircle[k].position.x; 
                flightPair[k].Conflict.LOSLocation.y = cpaCircle[k].position.y;
                var cutPoint = oriPath[i].Path.getIntersections(oriPath[j].Path);
                if (cutPoint.length == 1) {
                    var d1 = oriPath[i].Path.firstSegment.point.getDistance(cutPoint[0].position);
                    var d2 = oriPath[j].Path.firstSegment.point.getDistance(cutPoint[0].position);
                    var d0 = flightPair[k].Conflict.EntryClosure;
                    var conflictAngle = math.acos((d1*d1 + d2*d2 - d0*d0 )/( 2 * d1 * d2));
                    flightPair[k].Conflict.ConflictAngle = conflictAngle * 180 / pi;
                }
                else {
                    flightPair[k].Conflict.ConflictAngle = -1;   
                }
            }
        }
    }
}

function PostGenerationTask() {
    var scenId = allScen[currentScenId-1].scenario_id;
    scenario = new SCENARIO(scenId, n, numOfPair, mySector);
    for (var i=0; i<n; i++) {
        // The section below is for make a index list of pair in which the i-th flight being involved
        // Start create index list of parent pairs of this i-th flight
        var pairInvolved = [];
        for (var j=0; j<i; j++) {
            pairInvolved.push(liveCpaIdx[j][i]);
        }
        if (i<n-1) {
            for (var j=i+1; j<n; j++) {
                pairInvolved.push(liveCpaIdx[i][j]);
            }
        }
        oriPath[i].PairInvolved = pairInvolved;
        modPath[i].PairInvolved = pairInvolved;
        // End creating index list

        // ADD FLIGHT TO SCENARIO
        // PROPERTIES APPEAR HERE WILL BE CONSIDERED AS DRAW FEATURES FOR ML MODEL
        scenario.OriginalFlight.push({
            entry_x: oriPath[i].Path.firstSegment.point.x,
            entry_y: oriPath[i].Path.firstSegment.point.y,
            exit_x: oriPath[i].Path.lastSegment.point.x, 
            exit_y: oriPath[i].Path.lastSegment.point.y,
            middle_x: oriPath[i].Path.segments[1].point.x,
            middle_y: oriPath[i].Path.segments[1].point.y,
            entry_time: oriPath[i].EntryTime,
            exit_time: oriPath[i].ExitTime,
            entry_angle: oriPath[i].EntryAngle,
            exit_angle:  oriPath[i].ExitAngle,
        });
    
        // Show entry marker
        entryMarker[i].position = oriPath[i].Path.firstSegment.point;
        entryMarker[i].visible = true;

        // Show mid point of original path
        // midPoint[i].position = oriPath[i].Path.getPointAt(oriPath[i].Path.length/2);
        // midPoint[i].visible = true;
    }
    
    scenario.OriginalPair = flightPair; // flightPair is computed in ShowCurrentConflictLine()
    scenario.ConflictNum = flightPair.filter(function(element){ return element.HasConflict == true; }).length;

    for (var i=0; i<numOfPair; i++) {
        scenario.ModifiedPair[i] = new MODIFIEDPAIR();
        scenario.ModifiedPair[i].HasCPA = scenario.OriginalPair[i].HasConflict;
        scenario.ModifiedPair[i].Pair   = scenario.OriginalPair[i].Pair;
    }

    if (n == 2) {
        var syncOffset = (oriPath[1].EntryTime - oriPath[0].EntryTime) * mapAircraftSpeed;
        syncPoint.position = oriPath[0].Path.getPointAt(syncOffset); 
        //DrawVelArrow(syncPoint.position, oriPath[0].Path.getPointAt(syncOffset + initialSpeed), 0);        
        //DrawVelArrow(oriPath[1].Path.firstSegment.point, oriPath[1].Path.getPointAt(initialSpeed), 1);        
    }

    // Show reference elements
    midEntryRefPoint.position.x = (oriPath[1].Path.firstSegment.point.x + syncPoint.position.x) / 2;
    midEntryRefPoint.position.y = (oriPath[1].Path.firstSegment.point.y + syncPoint.position.y) / 2;
    SegmentCutBorderSector(view.center, oriPath[1].Path.segments[1].point, resolutionGuideLine);

    if (autoplayConflict) {
        PlayComplex('conflict', false);
    }    
}

// // ======================================
// // Function to randomize complex conflict
// // sector: instance of current sector
// // n: number of flights involved (n=3,4)
// // ======================================
// var limit2flight;   
// var fixedLosCircle = null;
// function RandomizeComplexConflict() {   
//     if (n < 2 || n > 4) {
//         alert('Please select number of flights between 2 and 4.');
//         return true;
//     }
//     if (n == 2) {
//         var losArea = mapMinCPA / 2;
//         var minEntryClosure = mapMinCPA * 2;
//     } else {
//         var losArea = mapMinCPA * 2;
//         var minEntryClosure = 2 * vs.Real2Map(mySector.SectorSize) * math.sin(pi / 2 / n);
//     }
//     var losCircle = new Path.Circle({
//         center: hidden,
//         radius: losArea
//     })
    
//     // Clear all previous vars and allow mouse action on all paths
//     ResetVars();

//     // Position of the LOS Circle where all flights going towards
//     // The LOS Circle must NOT too close to the sector border
//     // losCircle.position = [view.Size[0] * math.random(), view.Size[1] * math.random()];
    
//     if (n == 2 && limit2flight && fixedLosCircle != null) {
//         losCircle = fixedLosCircle;   
//     } 
//     else {
//         while (view.center.getDistance(losCircle.position) > 0.5 * vs.Real2Map(mySector.SectorSize)) {
//             losCircle.position = [view.Size[0] * math.random(), view.Size[1] * math.random()];
//         }
//         if (fixedLosCircle == null) {
//             fixedLosCircle = losCircle;
//         }   
//     } 

//     // Randomize entry and exit of the first flight
//     var point1 = RandomizeBorderPoint(mySector, limit2flight);
//     var entry = point1[0];
//     var point2 = RandomizeBorderPoint(mySector);
//     var exit  = point2[0];       
//     // Randomize first flight until it intersect LOS Circle
//     oriPath[0].Path.segments = [entry, exit];
//     while (!oriPath[0].Path.intersects(losCircle)) {
//         point2 = RandomizeBorderPoint(mySector);
//         exit  = point2[0];
//         oriPath[0].Path.segments = [entry, exit];
//     }
//     oriPath[0].EntryAngle = point1[1];
//     oriPath[0].ExitAngle  = point2[1];
//     // Get the first intersection of first flight with LOS Circle
//     // Mark the entry point, LOS approach location
//     // And set the modified path to be the same as original path, at the beginning
//     var cuts = oriPath[0].Path.getIntersections(losCircle);
//     oriPath[0].LosApproach = cuts[0].point;
//     distance2LosCircle[0] = oriPath[0].Path.firstSegment.point.getDistance(cuts[0].point);
//     entryMarker[0].position = oriPath[0].Path.firstSegment.point;
//     modPath[0].Path.segments = oriPath[0].Path.segments;
    
//     // Randomize the rest n-1 flights
//     for (var i = 1; i < n; i++) {
//         // Randomize the entry point of i-th flight until minEntryClosure is ok
//         while (true) {
//             var repeat = false;
//             point1 = RandomizeBorderPoint(mySector, limit2flight);
//             entry = point1[0];
//             for (var j = 0; j < i; j++) {
//                 if (entry.getDistance(oriPath[j].Path.firstSegment.point) < minEntryClosure) {
//                     // Check if distance between entries of any 2 flights drops below minEntryClosure
//                     // If so, re-do the randomization of entry point
//                     repeat = true;
//                     break
//                 }
//             }
//             if (repeat == false) {
//                 // If the minEntryClosure is satisfied for all flights, stop while loop,
//                 // and we have entry point of the i-th flight
//                 break
//             }
//         }
//         // Randomize the exit point of i-th flight until it intersects LOS Circle
//         oriPath[i].Path.segments = [entry, exit];
//         while (!oriPath[i].Path.intersects(losCircle)) {
//             point2 = RandomizeBorderPoint(mySector); 
//             exit = point2[0];
//             oriPath[i].Path.segments = [entry, exit];
//         }
//         oriPath[i].EntryAngle = point1[1];
//         oriPath[i].ExitAngle  = point2[1];
//         // Get the first intersection of i-th flight with LOS Circle
//         // Mark the entry point, LOS approach location
//         // And set the modified path to be the same as original path, at the beginning
//         cuts = oriPath[i].Path.getIntersections(losCircle);
//         oriPath[i].LosApproach = cuts[0].point;
//         distance2LosCircle[i] = oriPath[i].Path.firstSegment.point.getDistance(cuts[0].point);
//         entryMarker[i].position = entry;
//         modPath[i].Path.segments = oriPath[i].Path.segments;
//     }
//     // finished generating all flights
        
//     // Calculation of EntryTime
//     var maxDist = distance2LosCircle[0];
//     var maxDistIdx = 0;
//     for (var i = 0; i < n; i++) {
//         if (distance2LosCircle[i] > maxDist) {
//             maxDist = distance2LosCircle[i];
//             maxDistIdx = i;
//         }
//     }
//     oriPath[maxDistIdx].EntryTime = 0;
//     modPath[maxDistIdx].EntryTime = 0;
//     entryMarker[maxDistIdx].EntryTime = 0;
//     oriPath[maxDistIdx].ExitTime  = 3600 * vs.Map2Real(oriPath[0].Path.length) / mySector.AircraftSpeed;
//     for (var i = 0; i < n; i++) {
//         if (i != maxDistIdx) {
//             var distDiff = distance2LosCircle[maxDistIdx] - distance2LosCircle[i];
//             oriPath[i].EntryTime = 3600 * vs.Map2Real(distDiff) / mySector.AircraftSpeed;
//             modPath[i].EntryTime = 3600 * vs.Map2Real(distDiff) / mySector.AircraftSpeed;
//             oriPath[i].ExitTime  = oriPath[i].EntryTime + 3600 * vs.Map2Real(oriPath[i].Path.length) / mySector.AircraftSpeed;
//             entryMarker[i].EntryTime = 3600 * vs.Map2Real(distDiff) / mySector.AircraftSpeed;;
//         }
//     }
    
//     // Sort all flights by EntryTime. Earlier flight has lower index in array
//     // Color is also sorted
//     oriPath.sort(function(a, b) { return a.EntryTime - b.EntryTime });  
//     modPath.sort(function(a, b) { return a.EntryTime - b.EntryTime }); 
//     entryMarker.sort(function(a, b) { return a.EntryTime - b.EntryTime }); 
//     for (var i=0; i<n; i++) {
//         oriPath[i].Idx = i;
//         oriPath[i].Path.Idx = i;
//         modPath[i].Idx = i;
//         modPath[i].Path.Idx = i;
//         oriPath[i].Path.strokeColor = colorArr[i];
//         modPath[i].Path.strokeColor = colorArr[i];
//         aircraft[i].fillColor = colorArr[i];
//         entryMarker[i].Idx = i;  
//         entryMarker[i].strokeColor = colorArr[i];
//         entryMarker[i].fillColor = colorArr[i];              
//     }   
    
//     // Now check CPA
//     // Must redo when CPA falls into case 2-5 in CpaCalculator()
//     var result = ShowCurrentConflictLine();    
//     if (result == 'redo') {
//         return false;
//     } 
//     else {
        // return true;
//     }
// }


// =====================================
// Function to draw a velocity arrow
// =====================================
function DrawVelArrow(start, end, idx) {
    var tailVector = end.subtract(start);
    var headLine = tailVector.normalize(headLength);
    
    if (arrow[idx]) {
        arrow[idx].remove();
    } 
    vs.IndLayer.activate();
    arrow[idx] = new Group([
        new Path([start, end]),
        new Path([
            end.add(headLine.rotate(headAngle)),
            end,
            end.add(headLine.rotate(-headAngle))
        ])
    ]);
    arrow[idx].strokeColor = arrowColor;
    arrow[idx].strokeWidth = vs.FlightStroke;
}


// ======================================
// Function to play complex conflict
// ======================================
function PlayComplex(type, postAction) {    
    if (type == 'conflict') {
        var path = oriPath;
    }
    if (type == 'resolution') {
        var path = modPath;
    }
    var finished = new Array(n);
    finished.fill(false); // Indicating if a aircraft has finished travelling through the sector
    var travelled = new Array(n);
    travelled.fill(0); // Travelled distance of aircrafts
    var distance = new Array(n);
    for (var i = 0; i < n; i++) {
        distance[i] = path[i].Path.length; // Total distance to travel during animation
        aircraft[i].position = path[i].Path.firstSegment.point; // Set initial point of aircrafts
    }
    var playTime = 0;
    var step = new Array(n);
    animating = true;
    aircraft.map(function (element) {
        element.visible = true;
        return element
    })
    view.onFrame = function (event) {
        step.fill(playSpeed * mapAircraftSpeed);
        // for (var i = 0; i < n; i++) {
        //     if (playTime <= path[1].EntryTime) {
        //         console.log(playTime, '/', path[1].EntryTime);
        //     }
        //     if (playTime > path[i].EntryTime) {
        //         aircraft[i].visible = true;
        //         if (travelled[i] >= distance[i]) {
        //             aircraft[i].position = hidden;
        //             finished[i] = true;
        //         } else {
        //             // if (distance[i] - travelled[i] <= step[i]) {
        //             //     travelled[i] = distance[i];
        //             // } else {
        //                 travelled[i] += step[i];        
        //             // }
        //             try {
        //                 aircraft[i].position = path[i].Path.getPointAt(travelled[i]);
        //             } catch (error) {
        //                 aircraft[i].position = path[i].Path.lastSegment.point;
        //             }
        //         }
        //     }
        // }

        if (travelled[0] >= distance[0]) {
            aircraft[0].position = hidden;
            finished[0] = true;
        }
        if (travelled[1] >= distance[1]) {
            aircraft[1].position = hidden;
            finished[1] = true;
        }
        travelled[0] += step[0];   
        try {
            aircraft[0].position = path[0].Path.getPointAt(travelled[0]);
        } catch (error) {
            aircraft[0].position = path[0].Path.lastSegment.point;
        }     
        if (playTime > path[1].EntryTime) {
            travelled[1] += step[1];
            try {
                aircraft[1].position = path[1].Path.getPointAt(travelled[1]);
            } catch (error) {
                aircraft[1].position = path[1].Path.lastSegment.point;
            }    
        }
        var done = finished.every(function (value) {
            return value == true;
        });
        if (done) {
            animating = false;
            view.pause();
            aircraft.map(function (element) {
                element.visible = false;
                return element
            })
        }
        playTime += playSpeed;
    }
    if (postAction) {
        WaitForAnimation();
    }
}

// ====================================
// Function to wait for animation
// Then do some task after that
// ====================================
function WaitForAnimation() {
    if (animating) {
        setTimeout("WaitForAnimation()", 50);
        return;
    }
    ActionAfterAnimation();
}

function ActionAfterAnimation() {
    console.log('Animation completed');
}

// FUNCTION TO ACTUALLY CALCULATE CPA, GIVEN ENTRY AND EXIT OF 2 FLIGHTS AND THEIR SPEEDS
function CpaCalulator(a1begin, a1end, a2begin, a2end, mapSpeed) {
    var result;
    var d1 = a1end.subtract(a1begin).length;
    var d2 = a2end.subtract(a2begin).length;
    var v1 = [a1end.x - a1begin.x, a1end.y - a1begin.y];
    v1 = math.divide(v1, math.norm(v1));
    var v2 = [a2end.x - a2begin.x, a2end.y - a2begin.y];
    v2 = math.divide(v2, math.norm(v2));
    var w0 = [a1begin.x - a2begin.x, a1begin.y - a2begin.y];
    var dv = math.multiply(math.subtract(v1, v2), mapSpeed);
    var time2cpa = -(math.dot(w0, dv)) / (math.norm(dv) * math.norm(dv));
    if (time2cpa >= 0) {
        var travelledDist = mapSpeed * time2cpa;
        var cpaPoint1 = a1begin.add(math.multiply(v1, travelledDist));
        var cpaPoint2 = a2begin.add(math.multiply(v2, travelledDist));
        var cpaClosure = cpaPoint1.getDistance(cpaPoint2);
        if (travelledDist <= d1 && travelledDist <= d2 && cpaClosure < mapMinCPA) { 
            result = [true, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 1];            
        } else {
            if (cpaClosure >= mapMinCPA) {
                result = [false, cpaClosure, time2cpa, 'cpa point out of segment', null, 2];
            }
            if (travelledDist > d1 && travelledDist > d2) {
                result = [false, cpaClosure, time2cpa, 'cpa point out of segment', 'cpa point out of segment', 3];
            }
            if (travelledDist > d1) {
                result = [false, cpaClosure, time2cpa, 'cpa point out of segment', null, 4];
            }
            if (travelledDist > d2) {
                result = [false, cpaClosure, time2cpa, null, 'cpa point out of segment', 5];
            }
        }
    } else {
        result = [false, 'negative time2cpa', time2cpa, null, null, 6];
    }
    // console.log(result);
    return result
}

// Cpa calculator for two different speeds 
function CpaCalulator1(a1begin, a1end, a2begin, a2end, speed1, speed2) {
    var d1 = a1begin.getDistance(a1end);
    var d2 = a2begin.getDistance(a2end);
    var v1 = [a1end.x - a1begin.x, a1end.y - a1begin.y];
    var v2 = [a2end.x - a2begin.x, a2end.y - a2begin.y];
    v1 = math.divide(v1, math.norm(v1)); // directional unit vector
    v2 = math.divide(v2, math.norm(v2)); // directional unit vector
    var w0 = [a1begin.x - a2begin.x, a1begin.y - a2begin.y];
    var dv = math.subtract(math.multiply(v1, speed1), math.multiply(v2, speed2));
    var time2cpa = -(math.dot(w0, dv)) / (math.norm(dv) * math.norm(dv));
    // console.log(time2cpa);
    if (time2cpa > 0) {
        var travelledDist1 = speed1 * time2cpa;
        var travelledDist2 = speed2 * time2cpa;
        var cpaPoint1 = a1begin.add(math.multiply(v1, travelledDist1));
        var cpaPoint2 = a2begin.add(math.multiply(v2, travelledDist2));
        var cpaClosure = cpaPoint1.getDistance(cpaPoint2);
        if (travelledDist1 <= d1 && travelledDist2 <= d2 && cpaClosure < mapMinCPA) {
            return [true, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 1]
        } 
        else {
            if (cpaClosure >= mapMinCPA && travelledDist1 <= d1 && travelledDist2 <= d2) {
                return [false, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 2];
            }
            var dmin = math.min(d1, d2);
            var stop1 = a1begin.add(math.multiply(v1, dmin));
            var stop2 = a2begin.add(math.multiply(v2, dmin));
            cpaClosure = stop1.getDistance(stop2);
            return [false, cpaClosure, time2cpa, stop1, stop2, 3];
        }
    } 
    else {
        if (math.norm(w0) < mapMinCPA) {
            return [true, math.norm(w0), time2cpa, a1begin, a2begin, 4];    
        }
        else {
            return [false, math.norm(w0), time2cpa, a1begin, a2begin, 5];
        }
    }
}


// =============================================
// Function to show CPA indicators on screen
// Input: 
// - ownship: currently being modified flight
// - intruder: flight to check against
// =============================================
var freeConflictClosure = {
    closure: 1000,
    line: new Path.Line({
        segments: [hidden, hidden],
        strokeColor: orange,
        strokeWidth: 4
    })
}
var defaultCpaStatus = [false, 1000, -1, hidden, hidden, 0];

function ConflictDetector (flight1, flight2, k) { 
    var allCpa = [];
    var ownship, intruder;
    var intruderSpeed = mapAircraftSpeed;
    var ownshipSpeed = mapAircraftSpeed;
    var cpaStatus = [false];
    
    cpaLine[k].segments = [hidden, hidden];
    cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
    cpaLine[k].visible = false;
    cpaCircle[k].visible = false;        
    
    if (flight1.EntryTime > flight2.EntryTime) {
        ownship = flight1.Path;
        intruder = flight2.Path;
        var initialOffsetTime = flight1.EntryTime - flight2.EntryTime;
    }
    else {
        ownship = flight2.Path;
        intruder = flight1.Path;
        var initialOffsetTime = flight2.EntryTime - flight1.EntryTime;
    }
    var intruderInitialOffset = intruderSpeed * initialOffsetTime;
    

    // Check ownship[0] vs intruder [0]
    // if (debugMode) { console.log('Start checking Ownship[0] vs Intruder[0].'); }
    if (intruderInitialOffset < intruder.firstCurve.length) {
        var intruderStart = intruder.getPointAt(intruderInitialOffset);
        
        // begin markers are for debug purpose
        beginMarker1[0].position = ownship.firstSegment.point;
        beginMarker1[1].position = intruderStart;          
        
        cpaStatus = CpaCalulator1(
            ownship.firstSegment.point, ownship.segments[1].point,
            intruderStart, intruder.segments[1].point,
            ownshipSpeed, intruderSpeed
        );
        if (debugMode) {
            console.log('Checked Ownship[0] vs Intruder[0]:', cpaStatus);
        }
        if (cpaStatus[0]) {
            cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
            cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
            cpaLine[k].visible = cpaVisible;
            cpaCircle[k].visible = cpaVisible;
            freeConflictClosure.line.segments = [hidden, hidden];
            return cpaStatus
        }
        else { 
            allCpa.push(cpaStatus);
        }
    } 
    else {
        if (debugMode) {
            console.log('Skip checking Ownship[0] vs Intruder[0]: false <= intruderInitialOffset < intruder.firstCurve.length');
        }
        // allCpa.push(defaultCpaStatus);   
    }
    

    // Check ownship[0] vs intruder [1]
    // if (debugMode) { console.log('Start checking Ownship[0] vs Intruder[1].'); }
    if (intruderInitialOffset < intruder.firstCurve.length) {
        var intruderStart = intruder.segments[1].point;
        var offsetTime = (intruder.firstCurve.length - intruderInitialOffset) / intruderSpeed;        
    }
    else {
        var intruderStart = intruder.getPointAt(intruderInitialOffset);
        var offsetTime = 0;
    }
    ownshipStartOffset = ownshipSpeed * offsetTime;
    if (ownshipStartOffset < ownship.firstCurve.length) {
        var ownshipStart = ownship.getPointAt(ownshipStartOffset);

        // begin markers are for debug purpose
        beginMarker2[0].position = ownshipStart;
        beginMarker2[1].position = intruderStart;   
        
        cpaStatus = CpaCalulator1(
            ownshipStart, ownship.segments[1].point,
            intruderStart, intruder.lastSegment.point,
            ownshipSpeed, intruderSpeed
        );
        if (debugMode) {
            console.log('Checked Ownship[0] vs Intruder[1]:', cpaStatus);
        }   
        if (cpaStatus[0]) {
            cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
            cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
            cpaLine[k].visible = cpaVisible;
            cpaCircle[k].visible = cpaVisible;
            freeConflictClosure.line.segments = [hidden, hidden];
            return cpaStatus
        }
        else {
            allCpa.push(cpaStatus);
        }   
    } else {
        if (debugMode) {
            console.log('Skip checking Ownship[0] vs Intruder[1]');
        }
        // allCpa.push(defaultCpaStatus);   
    }
    
    // Check ownship[1] vs intruder [0]
    // if (debugMode) { console.log('Start checking Ownship[1] vs Intruder[0].'); }
    if (intruderInitialOffset < intruder.firstCurve.length) {
        var ownshipReachMidTime = ownship.firstCurve.length / ownshipSpeed; // calculated from ownship's entry      
        var intruderStartOffset = intruderInitialOffset + ownshipReachMidTime * intruderSpeed;
        if (intruderStartOffset < intruder.firstCurve.length) {
            var intruderStart = intruder.getPointAt(intruderStartOffset);
            
            // begin markers are for debug purpose
            beginMarker3[0].position = ownship.segments[1].point;
            beginMarker3[1].position = intruderStart;           

            cpaStatus = CpaCalulator1(
                ownship.segments[1].point, ownship.lastSegment.point,
                intruderStart, intruder.segments[1].point,
                ownshipSpeed, intruderSpeed
            );
            if (debugMode) {
                console.log('Checked Ownship[1] vs Intruder[0]:', cpaStatus);
            }
            if (cpaStatus[0]) {
                cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
                cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
                cpaLine[k].visible = cpaVisible;
                cpaCircle[k].visible = cpaVisible;
                freeConflictClosure.line.segments = [hidden, hidden];
                return cpaStatus
            }
            else {
                allCpa.push(cpaStatus);
            }
        }
        else {
            if (debugMode) {
                console.log('Skip checking Ownship[1] vs Intruder[0]');
            }  
            // allCpa.push(defaultCpaStatus); 
        }
    } else {
        if (debugMode) {
            console.log('Skip checking Ownship[1] vs Intruder[0]');
        }  
        // allCpa.push(defaultCpaStatus); 
    }

    // Check ownship[1] vs intruder [1]
    // if (debugMode) { console.log('Start checking Ownship[1] vs Intruder[1].'); }
    var skip = false
    if (intruderInitialOffset < intruder.firstCurve.length) {
        var intruderReachMidTime = intruder.firstCurve.length / intruderSpeed;  // calculated from Zero time
        var ownshipReachMidTime = initialOffsetTime + ownship.firstCurve.length / ownshipSpeed; // calculated from Zero time
        var reachMidTimeDiff = ownshipReachMidTime - intruderReachMidTime;
        if (reachMidTimeDiff < 0) {
            // ownship reaches mid point earlier
            var ownshipStartOffset = - reachMidTimeDiff * ownshipSpeed;
            if (ownshipStartOffset < ownship.lastCurve.length) {
                var ownshipStart = ownship.lastCurve.getPointAt(ownshipStartOffset);
                var intruderStart = intruder.segments[1].point;
            }
            else {
                var skip = true;
            }
        }
        else {
            // intruder reaches mid point earlier
            var intruderStartOffset = reachMidTimeDiff * intruderSpeed;
            if (intruderStartOffset < intruder.lastCurve.length) {
                var ownshipStart = ownship.segments[1].point;
                var intruderStart = intruder.lastCurve.getPointAt(intruderStartOffset);                
            }
            else {
                skip = true;
            }
        }
    }
    else {
        var ownshiEntry2MidTime = ownship.firstCurve.length / ownshipSpeed;
        var intruderStartOffset = (intruderInitialOffset - intruder.firstCurve.length) + intruderSpeed * ownshiEntry2MidTime;
        if (intruderStartOffset < intruder.lastCurve.length) {
            ownshipStart = ownship.segments[1].point;
            intruderStart = intruder.lastCurve.getPointAt(intruderStartOffset);
        }
        else {
            skip = true
        }
    }   
    
    if (skip == false) {        

        // begin markers are for debug purpose
        beginMarker4[0].position = ownshipStart;
        beginMarker4[1].position = intruderStart; 

        cpaStatus = CpaCalulator1(
            ownshipStart, ownship.lastSegment.point,
            intruderStart, intruder.lastSegment.point,
            ownshipSpeed, intruderSpeed
        );
        if (debugMode) {
            console.log('Checked Ownship[1] vs Intruder[1]:', cpaStatus);
        }
        if (cpaStatus[0]) {
            cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
            cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
            cpaLine[k].visible = cpaVisible;
            cpaCircle[k].visible = cpaVisible;
            freeConflictClosure.line.segments = [hidden, hidden]; 
            return cpaStatus       
        } else {
            allCpa.push(cpaStatus)   
        }
    } else {
        if (debugMode) {
            console.log('Skip checking Ownship[1] vs Intruder[1]');
        }
        // allCpa.push(defaultCpaStatus);
    }    

    console.log(allCpa);
    var freeConflictCpa = allCpa[0][1];
    var freeConflictCpaIdx = 0;
    for (var i=1; i<allCpa.length; i++) {
        if (allCpa[i][1] < freeConflictCpa) {
            freeConflictCpa = allCpa[i][1];
            freeConflictCpaIdx = i;  
        }
    }
    
    freeConflictClosure.closure = allCpa[freeConflictCpaIdx][1];
    freeConflictClosure.line.segments = [allCpa[freeConflictCpaIdx][3], allCpa[freeConflictCpaIdx][4]];  
    
    return allCpa[freeConflictCpaIdx]
}

// function LiveSegmentCPA(ownship, intruder, k) {
//     var ownshipPath = [],
//         intruderPath = [];
//     var syncOffset;
//     var timeShift = intruder.EntryTime - ownship.EntryTime;
//     var syncOffset = mapAircraftSpeed * math.abs(timeShift);
//     var cpaStatus;
//     var ownshipOffset, intruderOffset;
//     cpaLine[k].visible = false;
//     cpaCircle[k].visible = false;
//     // ================================================================
//     // FIRST CHECK THE INITIAL CLOSURE
//     if (debugMode) {
//         console.log('Check intial closure');
//     }
//     if (timeShift > 0) {
//         ownshipOffset = syncOffset;
//         intruderOffset = 0;
//         // move the syncPoint to new location and check its distance from intruder entry 
//         var newSyncPoint = ownship.Path.getPointAt(syncOffset);
//         var newInitialClosure = newSyncPoint.getDistance(intruder.Path.firstSegment.point);
//         if (newInitialClosure < mapMinCPA) {
//             // If initial closure drops below min cpa closure
//             cpaLine[k].segments = [newSyncPoint, intruder.Path.firstSegment.point];
//             cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//             cpaLine[k].visible = cpaVisible;
//             cpaCircle[k].visible = cpaVisible;
//             if (debugMode) {
//                 console.log('Flights', ownship.Idx, intruder.Idx, 'Initial closure below CPA threshold.');
//             }
//             return [true];
//         }
//     } else {
//         ownshipOffset = 0;
//         intruderOffset = syncOffset;
//     }
//     // If code reaches this point,  no problem with initial closure
//     // ================================================================
//     // Now consider ownship[0] and intruder[0]: 
//     if (debugMode) {
//         console.log('ownship[0] and intruder[0]');
//     }
//     if (ownshipOffset < ownship.Path.firstCurve.length && intruderOffset < intruder.Path.firstCurve.length) {
//         ownshipPath[0] = {
//             begin: ownship.Path.getPointAt(ownshipOffset),
//             end: ownship.Path.segments[1].point
//         }
//         intruderPath[0] = {
//             begin: intruder.Path.getPointAt(intruderOffset),
//             end: intruder.Path.segments[1].point
//         }
//         cpaStatus = CpaCalulator(ownshipPath[0].begin, ownshipPath[0].end, intruderPath[0].begin, intruderPath[0].end, mapAircraftSpeed);
//         if (cpaStatus[0]) {
//             cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//             cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//             cpaLine[k].visible = cpaVisible;
//             cpaCircle[k].visible = cpaVisible;
//             if (debugMode) {
//                 console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[0] vs Intruder[0] CPA detected:', cpaStatus);
//             }
//             return cpaStatus;
//         } else {
//             if (cpaStatus[5] >= 2 && cpaStatus[5] <= 5 && selectedIdx == null) {
//                 // redo = true;
//                 // console.log('Need to re-randomize:', ownship.Idx, intruder.Idx);
//                 // RandomizeComplexConflict();
//                 // console.log('Finished redo');
//                 // return 'redo';
//             }
//         }
//     }
//     // If code reaches this point,  ownship[0] and intruder[0] are fine.
//     // =================================================================
//     // Now consider ownship[0] and intruder[1] (if existing)
//     if (debugMode) {
//         console.log('ownship[0] and intruder[1]');
//     }
//     if (intruder.Path.curves.length == 2) {
//         if (syncOffset > intruder.Path.firstCurve.length && timeShift < 0) {
//             ownshipPath[0] = {
//                 begin: ownship.Path.firstSegment.point,
//                 end: ownship.Path.segments[1].point
//             }
//             intruderPath[1] = {
//                 begin: intruder.Path.getPointAt(syncOffset),
//                 end: intruder.Path.lastSegment.point
//             }
//             cpaStatus = CpaCalulator(ownshipPath[0].begin, ownshipPath[0].end, intruderPath[1].begin, intruderPath[1].end, mapAircraftSpeed);
//             if (cpaStatus[0]) {
//                 cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//                 cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//                 cpaLine[k].visible = cpaVisible;
//                 cpaCircle[k].visible = cpaVisible;
//                 if (debugMode) {
//                     console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[0] vs Intruder[1] CPA detected:', cpaStatus);
//                 }
//                 return cpaStatus;
//             }
//         } else {
//             if (intruder.Path.firstCurve.length + timeShift * mapAircraftSpeed <= ownship.Path.firstCurve.length) {
//                 ownshipPath[0] = {
//                     begin: ownship.Path.getPointAt(intruder.Path.firstCurve.length + timeShift * mapAircraftSpeed),
//                     end: ownship.Path.segments[1].point
//                 }
//                 intruderPath[1] = {
//                     begin: intruder.Path.segments[1].point,
//                     end: intruder.Path.lastSegment.point
//                 }
//                 cpaStatus = CpaCalulator(ownshipPath[0].begin, ownshipPath[0].end, intruderPath[1].begin, intruderPath[1].end, mapAircraftSpeed);
//                 if (cpaStatus[0]) {
//                     cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//                     cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//                     cpaLine[k].visible = cpaVisible;
//                     cpaCircle[k].visible = cpaVisible;
//                     if (debugMode) {
//                         console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[0] vs Intruder[1] CPA detected:', cpaStatus);
//                     }
//                     return cpaStatus;
//                 }
//             }
//         }
//     }
//     // If code reaches this point,  ownship[0] and intruder[1] are fine.
//     // =================================================================
//     // Now consider ownship[1] and intruder[0]
//     if (debugMode) {
//         console.log('ownship[1] and intruder[0]');
//     }
//     if (ownship.Path.curves.length == 2) {
//         if (syncOffset > ownship.Path.firstCurve.length && timeShift > 0) {
//             ownshipPath[1] = {
//                 begin: ownship.Path.getPointAt(syncOffset),
//                 end: ownship.Path.lastSegment.point
//             }
//             intruderPath[0] = {
//                 begin: intruder.Path.firstSegment.point,
//                 end: intruder.Path.segments[1].point
//             }
//             console.log('Test 1');
//             cpaStatus = CpaCalulator(ownshipPath[1].begin, ownshipPath[1].end, intruderPath[0].begin, intruderPath[0].end, mapAircraftSpeed);
//             if (cpaStatus[0]) {
//                 cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//                 cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//                 cpaLine[k].visible = cpaVisible;
//                 cpaCircle[k].visible = cpaVisible;
//                 if (debugMode) {
//                     console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[1] vs Intruder[0] CPA detected:', cpaStatus);
//                 }
//                 return cpaStatus;
//             }
//         } else {
//             if (ownship.Path.firstCurve.length - timeShift * mapAircraftSpeed <= intruder.Path.firstCurve.length) {
//                 ownshipPath[1] = {
//                     begin: ownship.Path.segments[1].point,
//                     end: ownship.Path.lastSegment.point
//                 }
//                 intruderPath[0] = {
//                     begin: intruder.Path.getPointAt(ownship.Path.firstCurve.length - timeShift * mapAircraftSpeed),
//                     end: intruder.Path.segments[1].point
//                 }
//                 console.log('Test 2');
//                 cpaStatus = CpaCalulator(ownshipPath[1].begin, ownshipPath[1].end, intruderPath[0].begin, intruderPath[0].end, mapAircraftSpeed);
//                 if (cpaStatus[0]) {
//                     cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//                     cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//                     cpaLine[k].visible = cpaVisible;
//                     cpaCircle[k].visible = cpaVisible;
//                     if (debugMode) {
//                         console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[1] vs Intruder[0] CPA detected:', cpaStatus);
//                     }
//                     return cpaStatus;
//                 }
//             }
//         }
//     }
//     // If code reaches this point, ownship[1] and intruder[0] are fine.
//     // ================================================================
//     // Now consider ownship[1] and intruder[1] (if any)
//     if (debugMode) {
//         console.log('ownship[1] and intruder[1]');
//     }
//     if (intruder.Path.curves.length == 2 && ownship.Path.curves.length == 2) {
//         console.log(intruder.Idx, ownship.Idx);
//         console.log(intruderOffset, ownshipOffset);
//         console.log('Test');
//         if (syncOffset <= ownship.Path.firstCurve.length && syncOffset <= intruder.Path.firstCurve.length) {
//             console.log('Test');
//             var ownshipShift = ownship.Path.firstCurve.length - ownshipOffset;
//             var intruderShift = intruder.Path.firstCurve.length - intruderOffset;
//             var commonShift = math.max(ownshipShift, intruderShift);
//             if (commonShift + ownshipOffset < ownship.Path.length && commonShift + intruderOffset < intruder.Path.length) {
//                 ownshipPath[1] = {
//                     begin: ownship.Path.getPointAt(commonShift + ownshipOffset),
//                     end: ownship.Path.lastSegment.point
//                 }
//                 intruderPath[1] = {
//                     begin: intruder.Path.getPointAt(commonShift + intruderOffset),
//                     end: intruder.Path.lastSegment.point
//                 }
//                 console.log('Test 3');
//                 cpaStatus = CpaCalulator(ownshipPath[1].begin, ownshipPath[1].end, intruderPath[1].begin, intruderPath[1].end, mapAircraftSpeed);
//                 if (cpaStatus[0]) {
//                     cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//                     cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//                     cpaLine[k].visible = cpaVisible;
//                     cpaCircle[k].visible = cpaVisible;
//                     if (debugMode) {
//                         console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[1] vs Intruder[1] CPA detected:', cpaStatus);
//                     }
//                     return cpaStatus;
//                 }
//             }
//         } else if (ownshipOffset > ownship.Path.firstCurve.length) {
//             console.log('Test 1');
//             if (intruder.Path.firstCurve.length < ownship.Path.length - ownshipOffset) {
//                 ownshipPath[1] = {
//                     begin: ownship.Path.getPointAt(ownshipOffset + intruder.Path.firstCurve.length),
//                     end: ownship.Path.lastSegment.point
//                 }
//                 intruderPath[1] = {
//                     begin: intruder.Path.segments[1].point,
//                     end: intruder.Path.lastSegment.point
//                 }
//                 console.log('Test 4');
//                 cpaStatus = CpaCalulator(ownshipPath[1].begin, ownshipPath[1].end, intruderPath[1].begin, intruderPath[1].end, mapAircraftSpeed);
//                 if (cpaStatus[0]) {
//                     cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//                     cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//                     cpaLine[k].visible = cpaVisible;
//                     cpaCircle[k].visible = cpaVisible;
//                     if (debugMode) {
//                         console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[1] vs Intruder[1] CPA detected:', cpaStatus);
//                     }
//                     return cpaStatus;
//                 }
//             }
//         } else if (intruderOffset > intruder.Path.firstCurve.length) {
//             console.log('Test');
//             if (ownship.Path.firstCurve.length < intruder.Path.length - intruderOffset) {
//                 ownshipPath[1] = {
//                     begin: ownship.Path.segments[1].point,
//                     end: ownship.Path.lastSegment.point
//                 }
//                 intruderPath[1] = {
//                     begin: intruder.Path.getPointAt(intruderOffset + ownship.Path.firstCurve.length),
//                     end: intruder.Path.lastSegment.point
//                 }
//                 console.log('Test 5');
//                 cpaStatus = CpaCalulator(ownshipPath[1].begin, ownshipPath[1].end, intruderPath[1].begin, intruderPath[1].end, mapAircraftSpeed);
//                 if (cpaStatus[0]) {
//                     cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
//                     cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
//                     cpaLine[k].visible = cpaVisible;
//                     cpaCircle[k].visible = cpaVisible;
//                     if (debugMode) {
//                         console.log('Flights', ownship.Idx, intruder.Idx, 'Ownship[1] vs Intruder[1] CPA detected:', cpaStatus);
//                     }
//                     return cpaStatus;
//                 }
//             }
//         }
//     }
//     // Congrats, there's no CPA detected
//     return [false];
// }

// ===============================
// Get polar angle of point
// ===============================
function GetPolarCoord(point) {
    var r = point.getDistance(view.center);
    var x =   point.x - view.center.x;
    var y = - point.y + view.center.y;
    var angle = math.atan2(y, x) * (180 / pi);
    if (angle < 0) {
        angle += 360;
    }
    return { radius: r, angle: angle }
}

// ===============================
// DATABASE READ / WRITE FUNCTIONS
// AND SERVER COMMUNICATION
// ===============================
function WriteConflictDB(data, type) {
    var request;
    if (type == 'simple_conflict') {
        request = 'type=simple_conflict&';
    } else {
        request = '';
    }
    request += 'all_flight=' + JSON.stringify(data.AllFlight);
    request += '&num_of_conflict=' + data.ConflictNum;
    request += '&num_of_flight=' + data.FlightNum;
    request += '&flight_pair=' + JSON.stringify(data.FlightPair);
    request += '&sector=' + JSON.stringify(data.Sector);
    
    var requestURL = hostAddress + 'php/writeConflictDB.php?' + encodeURI(request);
    var http = new XMLHttpRequest();
    http.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            if (response.status) {
                console.log(response.last_id);
            }
        }
    }
    http.open('GET', requestURL, true);
    http.setRequestHeader("Accept", "text/plain");
    http.send();
}

function WriteSimpleConflictDB(data) {
    var requestURL = hostAddress + 'php/writeConflict.php';
    var requestData = 'data=' + JSON.stringify(data)
    var http = new XMLHttpRequest();
    http.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            if (!response.status) {
                console.log('Error writting: ', response.error);
            }
            else {
                console.log('Wrote simple conflict to DB successfully.');
            }
        }
    }
    http.open('POST', requestURL, true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("Accept", "text/plain");
    http.setRequestHeader("Accept", "text/html");
    http.send(requestData);
}

function WriteResolution(scenarioId, data) {
    requestData = 'data=' + JSON.stringify(data) + "&scenario_id=" + scenarioId + "&subject_name=" + subjectName + "&session_id=" + sessionId  ;
    var requestURL = hostAddress + 'php/writeResolution.php';
    var http = new XMLHttpRequest();
    http.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            if (!response.status) {
                console.log('Error writting resolution: ', response.error);
            }
            else {
                console.log(scenResolution.length.toString() + ' resolutions added to database.')
            }
        }
    }
    http.open('POST', requestURL, true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("Accept", "text/plain");
    http.setRequestHeader("Accept", "text/html");
    http.send(requestData);
}

function WriteResolutionNode(data) {
    var dataToSend = data;
    if (data.length == 0) {
        dataToSend = [scenario];
    }
    $.ajax({
        url: 'scenario',        
        type: 'POST',
        headers: { 
            "Accept" : "text/plain; charset=utf-8",
            "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8"
        },
        data: {
            action: 'writeresolution',            
            csvfile: fileName,
            writeheader: writeHeader,
            data: JSON.stringify(dataToSend),            
        }, 
        async: true,
        success: function (result) {
            console.log(result);
            writeHeader = false;
        },
        complete: function () {
        }
    });
}

function UpdateFinalResolution(data) {
    var requestURL = hostAddress + 'php/updateFinalResolution.php?data=' + encodeURI(JSON.stringify(data));
    var http = new XMLHttpRequest();
    http.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            if (!response.status) {
                console.log('Error writting resolution: ', response.error);
            }
        }
    }
    http.open('GET', requestURL, true);
    http.setRequestHeader("Accept", "text/plain");
    http.send();
}

//=============================
// UPDATE SETTING (IF CHANGED)
//=============================
function GetSettingAndGenerate(source) {
    if (isLocalComputer) {
        var requestURL = hostAddress + 'php/readSetting.php?setting=all&source=' + source;
    } else {
        var requestURL = hostAddress + 'php/readSetting.php?setting=all';
    }
    $.ajax({
        url: requestURL,
        async: true,
        success: function (result) {
            setting = JSON.parse(result);
        },
        complete: function () {
            losVisible = setting.initial_los_marker == 1;
            cpaVisible = setting.cpa == 1;
            syncPointVisible = setting.syncpoint == 1;
            feedbackVisible = setting.feedback == 1;
            autoplayConflict = setting.autoplay_conflict == 1;
            autoplayResolution = setting.autoplay_resolution == 1;
            dataRecording = setting.data_recording == 1;
            playSpeed = parseFloat(setting.play_speed);
            timeLimit = parseInt(setting.time_limit);
            scenarioPerBreak = parseInt(setting.scenario_per_break);
            breakTime = parseInt(setting.break_time);
            restTime = parseInt(setting.rest_time);
            scenarioSource = setting.scenario_source;
            vs.FlighStroke = setting.flight_stroke;
            vs.ThickerStroke = setting.flight_stroke_selected;
            scenarioId = parseInt(setting.last_scenario_id) + 1;            
            AfterGetSetting();
        }
    });
}

function AfterGetSetting() {
    var success = false;
    while (!success) {
        success = RandomizeComplexConflict();
    }  
    PostGenerationTask(); 
    vs.AniLayer.bringToFront();    
    if (timing) {
        $('#generate-btn').prop('disabled', generateBtnDisabled);
        clearInterval(time2Next);
        clearInterval(timeLeft);
        $('#timer').html('10');
        $('#scen-counter').html( parseInt($('#scen-counter').html()) + 1 );
        timeLeft = setInterval("$('#timer').html( parseInt($('#timer').html()) - 1 );", 1000)
        time2Next = setTimeout("$('#next-btn').click();", 10000);
    }
    
    // Timing experiment:
 // end of timing experiment
}

// ====================================
// Function to Send triggers
// ====================================
function SendSoftTrigger(code, address) {
    var connection = new WebSocket(address);
    connection.onopen = function () {
        connection.send(code);
        console.log('Trigger', code, 'sent.');
    };
}

function SendHardTrigger(code) {    
    $.ajax({
        url: '/trigger?channel=' + code,
        async: true,
        success: function (result) {
            
        }
    });
}

// ===========================================================
// Function to create a CSV file for each experimental session
// ===========================================================
function InitializeNewCSVFile(data, source_file_name) {
    // var scenario_source = $('#input-file')[0].files[0].name;
    var source_id = $('#source-id').val().toString().padStart(2,'0');
    writeHeader = true;
    var today = new Date();
    var timeNow = today.getFullYear() + '-' + (today.getMonth()+1).toString().padStart(2,'0') + '-' + 
        today.getDate().toString().padStart(2,'0'); 
        // + 'T' + today.getHours().toString().padStart(2,'0') + "." + today.getMinutes().toString().padStart(2,'0') + "." + today.getSeconds().toString().padStart(2,'0');
    fileName = source_file_name + '-resolution-' + $('#subject-name').val() + '.csv';
    $.ajax({
        url: 'scenario?action=newfile&filename=' + fileName,
        type: 'GET',
        headers: { 
            "Accept" : "text/plain; charset=utf-8",
            "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8"
        },
        async: true,
        success: function (result) {
        },
        complete: function () {
        }
    });
}


// ============================================
// Function to update scores and show on screen
// ============================================
function UpdateScore() {
    recentScore.push(math.round(currentScore));
    recentScore.shift();
    var screenRecentScore = recentScore.join('&nbsp;&nbsp;&nbsp;&nbsp;');        
    if (feedbackVisible) {
        $('#recent-score').html(screenRecentScore);
        $('#current-score').html(math.round(currentScore));
    }
    else {
        $('#recent-score').html('N/A');
        $('#current-score').html('N/A');
    }
    cpaLine.map(function (element) {
        element.visible = true;        
        return element
    })
    cpaCircle.map(function (element) {
        element.visible = true;
        return element
    }) 
    $('#play-conflict-btn').prop('disabled', false);
    $('#play-resolution-btn').prop('disabled', false);   
}

// ============================================
// Function to export canvas to SGV
// ============================================
function GetSGV() {
    var svg = project.exportSVG({ asString: true });
    console.log(svg);
}

function SegmentCutBorderSector(cpaPoint1, cpaPoint2, line) {
    var x1 = cpaPoint1.x;
    var y1 = cpaPoint1.y;
    var x2 = cpaPoint2.x;
    var y2 = cpaPoint2.y;
    // sector center and radius
    var x0 = 400;
    var y0 = 400;
    var radius = 375;
    if (x1 == x2) {
        return [-10, -10, -10, -10]
    }
    var a0 = (y1 - y2) / (x1 - x2);
    var b0 = y1 - a0 * x1;
    var a = a0*a0 + 1;
    var b = -2*x0 + 2*a0*(b0 - y0);
    var c = x0*x0 + (b0 - y0)*(b0 - y0) - radius*radius;
    var delta = b*b - 4*a*c;
    var root1x = (- b + math.sqrt(delta)) / (2*a);
    var root2x = (- b - math.sqrt(delta)) / (2*a);
    var root1y = a0*root1x + b0;    
    var root2y = a0*root2x + b0;
    line.firstSegment.point.x = root1x;
    line.firstSegment.point.y = root1y;
    line.lastSegment.point.x  = root2x;
    line.lastSegment.point.y  = root2y;     
    return [root1x, root1y, root2x, root2y]
}