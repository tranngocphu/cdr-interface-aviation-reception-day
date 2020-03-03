// Function to transform coordinates (flipping Y)
function transform(flight, type) {
    if (type === 'conflict') {
        // X transform conflict
        flight.entry_x_0      = flight.entry_x_0.transX();
        flight.entry_x_1      = flight.entry_x_1.transX();
        flight.exit_x_0       = flight.exit_x_0.transX();
        flight.exit_x_1       = flight.exit_x_1.transX();
        flight.sync_point_x_0 = flight.sync_point_x_0.transX();
        flight.sync_point_x_1 = flight.sync_point_x_1.transX();    
        // Y transform conflict
        flight.entry_y_0      = flight.entry_y_0.transY();
        flight.entry_y_1      = flight.entry_y_1.transY();
        flight.exit_y_0       = flight.exit_y_0.transY();
        flight.exit_y_1       = flight.exit_y_1.transY();
        flight.sync_point_y_0 = flight.sync_point_y_0.transY();
        flight.sync_point_y_1 = flight.sync_point_y_1.transY(); 
    }
    if (type === 'surrounding') {
        flight.entry_x      = flight.entry_x.transX();
        flight.exit_x       = flight.exit_x.transX();
        flight.sync_point_x = flight.sync_point_x.transX();       
        flight.exit_y       = flight.exit_y.transY();
        flight.entry_y      = flight.entry_y.transY();
        flight.sync_point_y = flight.sync_point_y.transY(); 
    }
    return flight   
}
// Function to parse data received from node server or from file upload
function ParseScenarioData(data) {    
    console.log(data);
    if (data.data_origin === 'JavaScriptInterface' | !data) {
        return data
    }
    data.surrounding_flight  = JSON.parse(data.surrounding_flight);
    if (flipY) {
        // transform conflict flight
        data = transform(data,'conflict');
        data.surrounding_flight.map(function(element){
            return transform(element,'surrounding');   
        });
    }   
    return data 
}

// Function to load conflict flights
function LoadConflictFlight(currentScenario) {
    // INTRUDER:
    // load intruder - top view
    intruderTop.firstSegment.point = [ currentScenario.sync_point_x_0, currentScenario.sync_point_y_0 ];
    intruderTop.lastSegment.point  = [ currentScenario.exit_x_0, currentScenario.exit_y_0 ];
    intruderEntryMarkerTop.position  = intruderTop.firstSegment.point;
    intruderTop.entryTime = currentScenario.entry_time_0; // entry time
    intruderTop.syncOffset = (currentScenario.entry_time_1 - currentScenario.entry_time_0) * currentScenario.speed_0; // sync offset
    // load intruder - side view
    intruderSide.firstSegment.point = [ sideViewOrigin.x,                      (sideViewOrigin.y + currentScenario.intruder_level * sideLevelStep).transY() ];
    intruderSide.lastSegment.point  = [ sideViewOrigin.x + intruderTop.length, (sideViewOrigin.y + currentScenario.intruder_level * sideLevelStep).transY() ];
    intruderEntryMarkerSide.position = intruderSide.firstSegment.point;
    // flight level
    intruderLevel = currentScenario.intruder_level;
    intruderPointLevel = intruderLevel * 100 * feet2nm * nm2point;
    intruderNewPointLevel = intruderPointLevel;
    
    // OWNSHIP:
    // load ownship - top view
    ownshipTop.firstSegment.point = [ currentScenario.entry_x_1, currentScenario.entry_y_1 ];
    ownshipTop.lastSegment.point  = [ currentScenario.exit_x_1, currentScenario.exit_y_1 ];
    ownshipTop.insert(1, ownshipTop.getPointAt(ownshipTop.length/2)); // add mid point to ensure LOS detection works well on this
    ownshipEntryMarkerTop.position  = ownshipTop.firstSegment.point;
    ownshipTop.entryTime  = currentScenario.entry_time_1; // entry time of the ownship
    // load ownship - side view
    ownshipSide.firstSegment.point = [ sideViewOrigin.x,                     (sideViewOrigin.y + currentScenario.ownship_level * sideLevelStep).transY() ];
    ownshipSide.lastSegment.point  = [ sideViewOrigin.x + ownshipTop.length, (sideViewOrigin.y + currentScenario.ownship_level * sideLevelStep).transY() ];
    ownshipEntryMarkerSide.position  = ownshipSide.firstSegment.point;
    // flight level
    ownshipLevel = currentScenario.ownship_level;
    ownshipPointLevel = ownshipLevel * 100 * feet2nm * nm2point;
    ownshipNewPointLevel = ownshipPointLevel;
    
    // Prepare data for resolution

    // add 2 more points as place holder for vertical separation handles
    // // ownship
    ownshipSide.insert(1, ownshipSide.firstSegment.point.add( 0 * defaultHandleDistanceX, 0));
    ownshipSide.insert(2, ownshipSide.firstSegment.point.add( 0 * defaultHandleDistanceX, 0));
    // // intruder
    intruderSide.insert(1, intruderSide.firstSegment.point.add( 0 * defaultHandleDistanceX, 0));
    intruderSide.insert(2, intruderSide.firstSegment.point.add( 0 * defaultHandleDistanceX, 0));
    
    // Snap 2 handles to the added points, and hide them
    sideHandle1.position = ownshipSide.segments[1].point;  
    sideHandle1.visible = false;
    sideHandle2.position = ownshipSide.segments[2].point;
    sideHandle2.visible = false;
    
    // Snap overlay to ownship side and hide
    // // ownship
    ownshipOverlaySide[1].segments = [ ownshipSide.segments[1].point, ownshipSide.segments[2].point ];
    ownshipOverlaySide[1].visible = false;
    ownshipOverlaySide[2].segments = [ ownshipSide.segments[2].point, ownshipSide.segments[3].point ];
    ownshipOverlaySide[2].visible = false;
    // // intruder
    intruderOverlaySide[1].segments = [ intruderSide.segments[1].point, intruderSide.segments[2].point ];
    intruderOverlaySide[1].visible = false;
    intruderOverlaySide[2].segments = [ intruderSide.segments[2].point, intruderSide.segments[3].point ];
    intruderOverlaySide[2].visible = false;
    
    // initialize lateral resolution as place holder (top and side)
    // // ownship
    ownshipLateralResTop.firstSegment.point = ownshipTop.firstSegment.point;
    ownshipLateralResTop.lastSegment.point  = ownshipTop.lastSegment.point;
    ownshipLateralResTop.segments[1].point  = ownshipTop.getPointAt(ownshipTop.length/2);
    ownshipLateralResSide.children[0].segments[0].point = hidden;
    ownshipLateralResSide.children[0].segments[1].point = hidden;
    ownshipLateralResSide.children[0].segments[2].point = hidden;
    // // intruder
    intruderLateralResTop.firstSegment.point = intruderTop.firstSegment.point;
    intruderLateralResTop.lastSegment.point  = intruderTop.lastSegment.point;
    intruderLateralResTop.segments[1].point  = intruderTop.getPointAt(intruderTop.length/2);
    intruderLateralResSide.children[0].segments[0].point = hidden;
    intruderLateralResSide.children[0].segments[1].point = hidden;
    intruderLateralResSide.children[0].segments[2].point = hidden;
    
    // initialize vertical resolution as place holder (top)
    ownshipVerticalResTop.segments[0].point = ownshipTop.firstSegment.point;
    ownshipVerticalResTop.segments[3].point = ownshipTop.lastSegment.point;
}


// Function to load surrounding flights
function LoadSurroundingFlight(currentScenario) {
    surroundingFlight = currentScenario.surrounding_flight.length;
    for (let i=0; i<surroundingFlight; i++) {
        // top view
        srdFlightTop[i].firstSegment.point = [ currentScenario.surrounding_flight[i].sync_point_x, currentScenario.surrounding_flight[i].sync_point_y ];
        srdFlightTop[i].lastSegment.point  = [ currentScenario.surrounding_flight[i].exit_x,       currentScenario.surrounding_flight[i].exit_y ];      
        srdFlightTop[i].entryTime  = currentScenario.surrounding_flight[i].entry_time;  // entry time
        srdFlightTop[i].syncOffset = currentScenario.surrounding_flight[i].sync_offset; // sync offset
        srdEntryMarkerTop[i].position = srdFlightTop[i].firstSegment.point;
        srdEntryMarkerTop[i].idx = i;
        // side view
        srdFlightSide[i].firstSegment.point = [ sideViewOrigin.x, (sideViewOrigin.y + currentScenario.surrounding_flight[i].flight_level * sideLevelStep).transY() ] ;
        srdFlightSide[i].lastSegment.point  = [ sideViewOrigin.x + srdFlightTop[i].length, (sideViewOrigin.y + currentScenario.surrounding_flight[i].flight_level * sideLevelStep).transY() ]
        srdFlightSide[i].flightLevel = currentScenario.surrounding_flight[i].flight_level;
        srdEntryMarkerSide[i].position = srdFlightSide[i].firstSegment.point;
        srdEntryMarkerSide[i].idx = i;      
        // views link
        viewLink[i].children[0].segments = [ srdFlightSide[i].firstSegment.point, srdFlightTop[i].firstSegment.point ];
        viewLink[i].children[1].position = srdFlightSide[i].firstSegment.point.add(-15, 0);
        viewLink[i].children[1].content = i.toString();
        // flight level
        srdLevel[i] = currentScenario.surrounding_flight[i].flight_level;
        srdLevelSafe[i] = math.abs(srdLevel[i] - currentScenario.ownship_level) > 10;
        srdPointLevel[i] = srdLevel[i] * 100 * feet2nm * nm2point;
    }    
}


// Function to show a scenario
function ShowAScenario(currentScenarioId) {    
    $('#current-scen').val(currentScenarioId);
    currentScenario = allScen[currentScenarioId - 1];    
    LoadConflictFlight(currentScenario);
    LoadSurroundingFlight(currentScenario);
    if (currentScenario.resolution) {
        allResolution[currentScenarioId - 1] = currentScenario.resolution;
    }
    if (showResolutionHistory) {
        LoadSavedResolution(currentScenarioId);
    } 
    DectectAndShowLateralLOS();  
    ResetAllFlight(); // 3D
    RenderAllFlight();  // 3D
}

// Function to reset environment variables
function Reset() {
    ownshipSide.segments = [hidden, hidden];
    ownshipTop.segments = [hidden, hidden];
    intruderSide.segments = [hidden, hidden];
    intruderTop.segments = [hidden, hidden];
    srdEntryMarkerTop.map(function(element){
        element.position = hidden;
    })
    srdEntryMarkerSide.map(function(element){
        element.position = hidden;
    })
    ownshipEntryMarkerSide.position = hidden;
    ownshipEntryMarkerTop.position = hidden;
    intruderEntryMarkerSide.position = hidden;
    intruderEntryMarkerTop.position = hidden;
    srdFlightTop.map(function(element){
        element.segments = [hidden, hidden]        
    })
    srdFlightSide.map(function(element){
        element.segments = [hidden, hidden]        
    })
    sideHandle1.position = hidden;
    sideHandle2.position = hidden;
    topFinishLevelChange.map(function(element){
        element.position = hidden;
    })
    ownshipOverlaySide[1].segments = [hidden, hidden];
    ownshipOverlaySide[2].segments = [hidden, hidden];
    ownshipOverlaySide[2].strokeColor = color.ownship;
    ownshipOverlayTop[1].segments = [hidden, hidden];
    ownshipOverlayTop[2].segments = [hidden, hidden];
    ownshipOverlayTop[2].strokeColor = color.ownship;
    sideVerticalLine.position.x = sideViewOrigin.x;
    sideVerticalLine.children[1].content = ('00 sec').padStart(13, ' ');
    handleDistanceX = defaultHandleDistanceX;
    viewLink.map(function(element) {
        element.visible = false;
    })
    selectedAircraft = false;
    verticalSeparation = false;
    lateralSeparation  = false;
    $('#climb-rate').val(1500);
    $('#current-climb-rate').html('1500');
    $('#level-change').html('N/A');
    $('#run-conflict').val(0);
    $('#run-resolution').val(0);
    ownshipLateralResTop.visible = false;
    $('#vertical-sep-label').removeClass('bold-text'); 
    $('#lateral-sep-label').removeClass('bold-text'); 
    hasLateralRes = false;
    hasVerticalRes = false;    
    $('#lateral-res').prop('disabled', true);
    $('#vertical-res').prop('disabled', true);
    $('#lateral-res').prop('checked', false);
    $('#vertical-res').prop('checked', false);
    $('#lateral-sep').prop('disabled', true);
    $('#vertical-sep').prop('disabled', true);
    $('#lateral-sep').prop('checked', false);
    $('#vertical-sep').prop('checked', false);
    $('#blue-aircraft').prop('checked', false);
    $('#red-aircraft').prop('checked', false);
    $('#submit-btn').prop('disabled', true);
    ownshipLateralResSide.visible = false;
    ownshipLateralResSide.children[1].position = hidden;
    intruderLateralResSide.visible = false;
    intruderLateralResSide.children[1].position = hidden;
    // surroundingLos.map(function(element) {
    //     element.children[0].segments = [hidden, hidden],
    //     element.children[1].position = hidden
    // });
    surroundingLos.map(function(element) {
        element.children[0].segments = [hidden, hidden];
        element.children[1].position = hidden;
        element.children[2].position = hidden;
    });
    intruderLos.children[0].segments = [hidden, hidden];
    intruderLos.children[1].position = hidden;
    intruderLos.children[2].position = hidden;
    currentResolution = { scenario_id: null, lateral: null, vertical: null, final_res: null };
}


// ====================================================================
// LOS DETECTION SECTION

// Construct 3D point
function Construct3DPoint(planarPoint, flightPointLevel) {
    return [planarPoint.x, planarPoint.y, flightPointLevel]
}

// Function to calculate cpa of two flight segments
function SpaceCpaCalculator(begin1, end1, speed1, begin2, end2, speed2) {
    // Inputs:
    //   begin1, end1, begin2, end2: 3-dimensional arrays [x, y, z]
    //   speed1, speed2: ground speed of 2 aircrafts
    begin1 = math.matrix(begin1);
    begin2 = math.matrix(begin2);
    end1   = math.matrix(end1);
    end2   = math.matrix(end2);
    let d1 = math.distance(begin1, end1);
    let d2 = math.distance(begin2, end2);
    let v1 = math.divide(math.subtract(end1, begin1), d1); // directional unit vector
    let v2 = math.divide(math.subtract(end2, begin2), d2); // directional unit vector
    let w0 = math.subtract(begin1, begin2);
    let dv = math.subtract(math.multiply(v1, speed1), math.multiply(v2, speed2));
    let time2cpa = - (math.dot(w0, dv)) / (math.norm(dv) * math.norm(dv));
    if (time2cpa > 0) {
        let travelledDist1 = speed1 * time2cpa;
        let travelledDist2 = speed2 * time2cpa;
        let cpaPoint1 = math.add(begin1, math.multiply(v1, travelledDist1));
        let cpaPoint2 = math.add(begin2, math.multiply(v2, travelledDist2));
        let cpaClosure = math.distance(cpaPoint1, cpaPoint2);
        cpaPoint1 = new Point(math.subset(cpaPoint1, math.index(0)), math.subset(cpaPoint1, math.index(1)));
        cpaPoint2 = new Point(math.subset(cpaPoint2, math.index(0)), math.subset(cpaPoint2, math.index(1)));
        if (cpaClosure < cpaThreshold && travelledDist1 <= d1 && travelledDist2 <= d2 ) {
            return [true, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 1]
        }
        else {
            if (cpaClosure >= cpaThreshold && travelledDist1 <= d1 && travelledDist2 <= d2) {
                return [false, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 2]
            } 
            else {
                let dmin = math.min(d1, d2);
                let stop1 = math.add(begin1, math.multiply(v1, dmin));
                let stop2 = math.add(begin2, math.multiply(v2, dmin));
                cpaClosure = math.distance(stop1, stop2);
                stop1 = new Point(math.subset(stop1, math.index(0)), math.subset(stop1, math.index(1)));
                stop2 = new Point(math.subset(stop2, math.index(0)), math.subset(stop2, math.index(1)));
                return [false, cpaClosure, time2cpa, stop1, stop2, 3]
            }
        }
    }
    else {
        begin1 = new Point(math.subset(begin1, math.index(0)), math.subset(begin1, math.index(1)));
        begin2 = new Point(math.subset(begin2, math.index(0)), math.subset(begin2, math.index(1)));
        if (math.norm(w0) < cpaThreshold) {
            return [true, math.norm(w0), time2cpa, begin1, begin2, 4]
        }
        else {
            return [false, math.norm(w0), time2cpa, begin1, begin2, 5]
        }
    }
}

// Function to detect conflict between lateral reslolution and intruder
function LateralConflictDetector(ownship, ownshipPointLevel, ownshipSpeed, intruder, intruderPointLevel, intruderSpeed) {
    let cpaResult = [];
    let begin2 = Construct3DPoint(intruder.firstSegment.point, intruderPointLevel);
    let end2 = Construct3DPoint(intruder.lastSegment.point , intruderPointLevel);
    let begin1 = Construct3DPoint(ownship.firstSegment.point, ownshipPointLevel);
    let end1 = Construct3DPoint(ownship.segments[1].point , ownshipPointLevel);
    let conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed);
    if (conflict[0]) {
        return conflict
    }
    else {        
        let ownshipTime2Turn = ownship.firstCurve.length / ownshipSpeed;
        let intruderOffset = ownshipTime2Turn * intruderSpeed;
        if (intruderOffset > intruder.length) {
            return conflict
        }
        else {
            cpaResult.push(conflict); // store conflict result from 1st check
            begin2 = Construct3DPoint(intruder.getPointAt(intruderOffset), intruderPointLevel);
            begin1 = Construct3DPoint(ownship.segments[1].point, ownshipPointLevel);
            end1   = Construct3DPoint(ownship.lastSegment.point, ownshipPointLevel);
            conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed);
            // adjust time2cpa of 2nd check by adding time needed for ownship to teach turning point :
            conflict[2] = conflict[2] + ownshipTime2Turn; 
            if (conflict[0]) {
                return conflict
            } 
            else {
                cpaResult.push(conflict);                
                let idx;
                if (cpaResult[0][1] < cpaResult[1][1]) {
                    idx = 0;
                } 
                else {
                    idx = 1;
                }
                return cpaResult[idx];
            }
        }
    }
}


// Function to detect and show LOS when performing lateral separation
// If no argument provided, go for lateral mode
function DectectAndShowLateralLOS(mode) {
    let verticalMode = false;
    let host, hostPointLevel;
    if (arguments.length === 1 & mode === 'for-vertical-analyze') {
        if (selectedAircraft == 'blue') {
            host = ownshipTop;            
        } else if (selectedAircraft == 'red') {
            host = intruderTop;            
        }
        verticalMode = true;        
    } 
    // check against srd flights    
    if (selectedAircraft == 'blue') {
        host = ownshipLateralResTop;
        hostPointLevel = ownshipPointLevel;
    } else if (selectedAircraft == 'red') {
        host = intruderLateralResTop;
        hostPointLevel = intruderPointLevel;
    } else {
        host = ownshipLateralResTop;
        hostPointLevel = ownshipPointLevel;
    }
    for (let i=0; i<surroundingFlight; i++) {
        let los = LateralConflictDetector(host, hostPointLevel, commonSpeed, srdFlightTop[i], srdPointLevel[i], commonSpeed);        
        if (los[0]) {                                    
            if (!srdLevelSafe[i]) { // intruder level in danger zone, show actual los marker   
                surroundingLos[i].children[0].segments = [los[3], los[4]];             
                surroundingLos[i].children[0].strokeColor = red;
                surroundingLos[i].children[0].dashArray = null;
                surroundingLos[i].children[0].visible = true;
                surroundingLos[i].children[1].position = los[3].add(los[4]).divide(2);
                surroundingLos[i].children[2].position = srdFlightSide[i].getPointAt(commonSpeed * los[2]);
            } else { // intruder level in safe zone, hide actual los marker:  
                surroundingLos[i].children[0].segments = hidden; // hide in top view
                surroundingLos[i].children[2].position = hidden; // hide in side view
                if (verticalMode & showPotentialLos) { // if in verticalMode when intruder in safe zone, show potential los marker if the setting is so
                    // surroundingLos[i].children[3].position = srdFlightSide[i].getPointAt(commonSpeed * los[2]);  
                } else { // hide potential los marker:
                    // surroundingLos[i].children[3].position = hidden;  
                }
            }                                   
        } else {
            surroundingLos[i].children[0].segments = [los[3], los[4]];
            surroundingLos[i].children[0].strokeColor = black;
            surroundingLos[i].children[0].dashArray = lineWidth.dashArray;
            surroundingLos[i].children[0].visible = showGoodCpa;
            surroundingLos[i].children[1].position = hidden;
            surroundingLos[i].children[2].position = hidden;
            surroundingLos[i].children[3].position = hidden;
        }
    }

    // check against intruder
    if (selectedAircraft == 'blue') {
        los = LateralConflictDetector(ownshipLateralResTop, ownshipPointLevel, commonSpeed, intruderTop, intruderPointLevel, commonSpeed);
    } else if (selectedAircraft == 'red') {
        los = LateralConflictDetector(intruderLateralResTop, intruderPointLevel, commonSpeed, ownshipTop, ownshipPointLevel, commonSpeed);
    } else {
        los = LateralConflictDetector(ownshipLateralResTop, ownshipPointLevel, commonSpeed, intruderTop, intruderPointLevel, commonSpeed);    
    }   
    intruderLos.children[0].segments = [los[3], los[4]];
    if (los[0]) {
        intruderLos.children[0].strokeColor = red;
        intruderLos.children[0].dashArray = null;
        intruderLos.children[0].visible = true;
        intruderLos.children[1].position = los[3].add(los[4]).divide(2);
        if (selectedAircraft == 'blue') {
            intruderLos.children[2].position = intruderSide.getPointAt(commonSpeed * los[2]);
        } else if (selectedAircraft == 'red') {
            intruderLos.children[2].position = ownshipSide.getPointAt(commonSpeed * los[2]);
        }
        
    } else {
        intruderLos.children[0].strokeColor = black;
        intruderLos.children[0].dashArray = lineWidth.dashArray;
        intruderLos.children[0].visible = showGoodCpa;
        intruderLos.children[1].position = hidden;
        intruderLos.children[2].position = hidden;
    }
}


// Function to detect conflict between vertical reslolution and intruder
function VerticalConflictDetector(ownship, ownshipPointLevelArr, ownshipSpeed, intruder, intruderPointLevel, intruderSpeed) {
    // Note: ownshipPointLevelArr consists of 2 point level values: current level and new level => [ lv1, lv2 ]
    // ASSUMPTION: ownship maintains its ground speed during level changing
    let ownshipCurrentLevel = ownshipPointLevelArr[0];
    let ownshipNewLevel = ownshipPointLevelArr[1];
    let output;
    let begin2 = Construct3DPoint(intruder.firstSegment.point, intruderPointLevel);
    let end2   = Construct3DPoint(intruder.lastSegment.point, intruderPointLevel);
    let begin1 = Construct3DPoint(ownship.firstSegment.point, ownshipCurrentLevel);
    let end1   = Construct3DPoint(ownship.segments[1].point, ownshipCurrentLevel); 
    let conflict = [false, 0, 0, hidden, hidden, 0];
    // console.log('Intruder Level:', intruderPointLevel);
    // console.log('Ownship New PointLevel:', ownshipNewLevel);
    // console.log('Level Diff from Intruder 0:', ownshipNewLevel - intruderPointLevel, 'Threshold:', verticalThreshold);    
    // FIRST CHECK: first segment of ownship (segment on current level) vs intruder...    
    conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed);    // ACTUAL FIRST CHECK
    if (math.abs(ownshipCurrentLevel - intruderPointLevel) > verticalThreshold) {
        conflict[0] = false;
    }
    if (conflict[0]) {
        return conflict
    } 
    
    // ======================
    // First check is passed, come to SECOND CHECK: level transitional segment vs intruder...  
    output = conflict;
    let ownshipTime2Handle1 = ownship.firstCurve.length / ownshipSpeed;  // time calculated from beginning
    let intruderOffset = ownshipTime2Handle1 * intruderSpeed;  
    if (intruderOffset > intruder.length) {
        // skip this second check because intruder no longer in sector when ownship reaches its 2nd segment
        // just return the latest conflict result (with min cpa closure)
        return output
    }
    // prepare for second check...
    begin2 = Construct3DPoint(intruder.getPointAt(intruderOffset), intruderPointLevel);
    begin1 = Construct3DPoint(ownship.segments[1].point, ownshipCurrentLevel);
    end1   = Construct3DPoint(ownship.segments[2].point, ownshipNewLevel);
    conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed);  // ACTUAL SECOND CHECK
    // calculate level of cpa point on ownship
    let localTime2Cpa = conflict[2]; // this is time taken for ownship to move from handel1 to cpa
    let ownshipLevelAtCpa = ownshipCurrentLevel + math.sign(ownshipNewLevel-ownshipCurrentLevel) * localTime2Cpa * (climbRate * feet2nm * nm2point);
    // console.log('Ownship Level at CPA:', ownshipLevelAtCpa);
    // console.log(' ');
    conflict[2] = conflict[2] + ownshipTime2Handle1; // calculate time cpa from the beginning
    if (math.abs(ownshipLevelAtCpa - intruderPointLevel) > verticalThreshold) {
        conflict[0] = false;
    }
    if (conflict[0]) {
        return conflict
    }
    if (conflict[1] < output[1]) {
        output = conflict; // choose the one with smaller cpa closure
    }

    // ======================
    // ... second check is passed, now come to THIRD CHECK: new level segment vs intruder
    let ownshipTime2Handle2 = (ownship.firstCurve.length + ownship.curves[1].length) / ownshipSpeed;  // time calculated from beginning
    intruderOffset = ownshipTime2Handle2 * intruderSpeed;
    if (intruderOffset > intruder.length) {                   
        // skip this third check because intruder no longer in sector when ownship starts 3rd segment
        // just return the latest conflict result (with min cpa closure)
        return output
    }
    // prepare for third check
    begin2 = Construct3DPoint(intruder.getPointAt(intruderOffset), intruderPointLevel);
    begin1 = Construct3DPoint(ownship.segments[2].point, ownshipNewLevel);
    end1   = Construct3DPoint(ownship.segments[3].point, ownshipNewLevel);
    conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed);  // ACTUAL THIRD CHECK                    
    conflict[2] = conflict[2] + ownshipTime2Handle2;
    if (math.abs(ownshipNewLevel - intruderPointLevel) > verticalThreshold) {
        conflict[0] = false;
    }
    if (conflict[0]) {
        return conflict  
    }    
    // third check is also passed, now select the min good cpa closure to output
    if (conflict[1] < output[1]) {
        output = conflict
    }
    return output
}


// Function to detect and show LOS when performing vertical separation
function DectectAndShowVerticalLOS () {
    // check against surrounding flights
    for (let i=0; i<surroundingFlight; i++) {
        let los = VerticalConflictDetector(ownshipVerticalResTop, [ownshipPointLevel, ownshipNewPointLevel], commonSpeed, srdFlightTop[i], srdPointLevel[i], commonSpeed);
        surroundingLos[i].children[0].segments = [los[3], los[4]];
        if (los[0]) {            
            surroundingLos[i].children[0].strokeColor = red;
            surroundingLos[i].children[0].dashArray = null;
            surroundingLos[i].children[0].visible = true;
            surroundingLos[i].children[1].position = los[3].add(los[4]).divide(2);
            surroundingLos[i].children[2].position = srdFlightSide[i].getPointAt(commonSpeed * los[2]);
            surroundingLos[i].children[3].visible = false;
        } else {
            surroundingLos[i].children[0].strokeColor = black;
            surroundingLos[i].children[0].dashArray = lineWidth.dashArray;
            surroundingLos[i].children[0].visible = showGoodCpa;
            surroundingLos[i].children[1].position = hidden;
            surroundingLos[i].children[2].position = hidden;
            surroundingLos[i].children[3].visible = true;
        }
    }
    // check against intruder
    los = VerticalConflictDetector(ownshipVerticalResTop, [ownshipPointLevel, ownshipNewPointLevel], commonSpeed, intruderTop, intruderPointLevel, commonSpeed);
    intruderLos.children[0].segments = [los[3], los[4]];
    if (los[0]) {
        intruderLos.children[0].strokeColor = red;
        intruderLos.children[0].dashArray = null;
        intruderLos.children[0].visible = true;
        intruderLos.children[1].position = los[3].add(los[4]).divide(2);
        intruderLos.children[2].position = intruderSide.getPointAt(commonSpeed * los[2]);
        intruderLos.children[3].visible = false;
    } else {
        intruderLos.children[0].strokeColor = black;
        intruderLos.children[0].dashArray = lineWidth.dashArray;
        intruderLos.children[0].visible = showGoodCpa;
        intruderLos.children[1].position = hidden;
        intruderLos.children[2].position = hidden;
        intruderLos.children[3].visible = true;
    }
}

// ====================================================================
// Function to Show/Hide all graphical information regardings flight(s)
function ShowFlight(show=[], hide=[]) {
    for (idx in show) {
        srdFlightTop[idx].visible = true;
        srdFlightSide[idx].visible = true;
        srdEntryMarkerTop[idx].visible = true;
        srdEntryMarkerSide[idx].visible = true;
    }
    for (idx in hide) {
        srdFlightTop[idx].visible = false;
        srdFlightSide[idx].visible = false;
        srdEntryMarkerTop[idx].visible = false;
        srdEntryMarkerSide[idx].visible = false;
    }
}


// ====================================================================
// Separation modes control
function EnableVerticalSeparation(state) {
    if (!currentScenario) {
        return
    }
    
    verticalSeparation = state;
    lateralSeparation = !state;
    ownshipOverlaySide.map(function(element) {
        element.visible = state;
        return element
    })
    ownshipOverlayTop.map(function(element) {
        element.visible = state;
        return element
    })
    sideHandle1.visible = state;
    sideHandle2.visible = state;
    
    if (selectedAircraft == 'blue') {
        ownshipLateralResTop.visible = !state; 
        ownshipLateralResSide.visible = !state; 
    } else if (selectedAircraft == 'red') {
        intruderLateralResTop.visible = !state; 
        intruderLateralResSide.visible = !state; 
    } else { }
       
    topFinishLevelChange.map(function(element){
        element.visible = false;
        return element
    })
    // Reset los indicators
    surroundingLos.map(function(element) {
        element.children[0].segments = [hidden, hidden];
        element.children[1].position = hidden;
        element.children[2].position = hidden;
        element.children[3].position = hidden;
        element.children[3].visible  = true;
    });
    intruderLos.children[0].segments = [hidden, hidden];
    intruderLos.children[1].position = hidden;
    intruderLos.children[2].position = hidden;
    intruderLos.children[3].position = hidden;
    intruderLos.children[3].visible  = true;
    
    // Disable climb rate changer
    $('#climb-rate').prop('disabled', !state);

    if (state) {
        // if vertical separation is selected, snap ownship side ot its overlay (current resolution)
        ownshipSide.segments[1].point = ownshipOverlaySide[1].firstSegment.point;
        ownshipSide.segments[2].point = ownshipOverlaySide[1].lastSegment.point;  
        ownshipSide.lastSegment.point = ownshipOverlaySide[2].lastSegment.point;
        $('#vertical-sep-label').addClass('bold-text'); 
        $('#lateral-sep-label').removeClass('bold-text');        
        ownshipOverlayTop[1].segments = [
            ownshipTop.getPointAt(ownshipSide.segments[1].point.x - sideViewOrigin.x), 
            ownshipTop.getPointAt(ownshipSide.segments[2].point.x - sideViewOrigin.x)
        ];
        ownshipOverlayTop[2].segments = [
            ownshipTop.getPointAt(ownshipSide.segments[2].point.x - sideViewOrigin.x), 
            ownshipTop.lastSegment.point
        ];
        if (hasVerticalRes) {
            DectectAndShowVerticalLOS ();
        } else {
            // // comment the line below ==> no need to show current lateral res when just switch to vertical sep mode
            // DectectAndShowLateralLOS('for-vertical-analyze');
        }
        
        
    }
    else {
        // if lateral separation is selected, restore y position of all ownshipSide's and intruderSide's points. Its overlay is untouched
        
        if (selectedAircraft == 'blue') {
            ownshipSide.segments[1].point.y = ownshipSide.firstSegment.point.y;
            ownshipSide.segments[2].point.y = ownshipSide.firstSegment.point.y;
            ownshipSide.lastSegment.point.y = ownshipSide.firstSegment.point.y;
        }

        if (selectedAircraft == 'red') {                    
            intruderSide.segments[1].point.y = intruderSide.firstSegment.point.y;
            intruderSide.segments[2].point.y = intruderSide.firstSegment.point.y;
            intruderSide.lastSegment.point.y = intruderSide.firstSegment.point.y;
        }    
        
        
        $('#vertical-sep-label').removeClass('bold-text'); 
        $('#lateral-sep-label').addClass('bold-text');
        
        DectectAndShowLateralLOS();    
    }
}


// Save current resolution to memory
function SaveResolution(currentScenatioId) {    
    if (!currentScenario) {
        return
    }
    currentResolution = {
        scenario_id: currentScenarioId,
        lateral_blue: {
            top: { 
                segments: [
                    { x: ownshipLateralResTop.segments[0].point.x, y: ownshipLateralResTop.segments[0].point.y },
                    { x: ownshipLateralResTop.segments[1].point.x, y: ownshipLateralResTop.segments[1].point.y },
                    { x: ownshipLateralResTop.segments[2].point.x, y: ownshipLateralResTop.segments[2].point.y },
                ]},
            side: { 
                segments: [
                    { x: ownshipLateralResSide.children[0].segments[0].point.x, y: ownshipLateralResSide.children[0].segments[0].point.y },
                    { x: ownshipLateralResSide.children[0].segments[1].point.x, y: ownshipLateralResSide.children[0].segments[1].point.y },
                    { x: ownshipLateralResSide.children[0].segments[2].point.x, y: ownshipLateralResSide.children[0].segments[2].point.y },
                ]}
            },
        lateral_red: {
            top: { 
                segments: [
                    { x: intruderLateralResTop.segments[0].point.x, y: intruderLateralResTop.segments[0].point.y },
                    { x: intruderLateralResTop.segments[1].point.x, y: intruderLateralResTop.segments[1].point.y },
                    { x: intruderLateralResTop.segments[2].point.x, y: intruderLateralResTop.segments[2].point.y },
                ]},
            side: { 
                segments: [
                    { x: intruderLateralResSide.children[0].segments[0].point.x, y: intruderLateralResSide.children[0].segments[0].point.y },
                    { x: intruderLateralResSide.children[0].segments[1].point.x, y: intruderLateralResSide.children[0].segments[1].point.y },
                    { x: intruderLateralResSide.children[0].segments[2].point.x, y: intruderLateralResSide.children[0].segments[2].point.y },
                ]}
            },
        vertical: {
            top:  [
                { segments: [
                    { x: ownshipOverlayTop[0].segments[0].point.x, y: ownshipOverlayTop[0].segments[0].point.y },
                    { x: ownshipOverlayTop[0].segments[1].point.x, y: ownshipOverlayTop[0].segments[1].point.y }
                ]},
                { segments: [
                    { x: ownshipOverlayTop[1].segments[0].point.x, y: ownshipOverlayTop[1].segments[0].point.y },
                    { x: ownshipOverlayTop[1].segments[1].point.x, y: ownshipOverlayTop[1].segments[1].point.y }
                ]},
                { segments: [
                    { x: ownshipOverlayTop[2].segments[0].point.x, y: ownshipOverlayTop[2].segments[0].point.y },
                    { x: ownshipOverlayTop[2].segments[1].point.x, y: ownshipOverlayTop[2].segments[1].point.y }
                ]}
            ],
            side: [
                { segments: [
                    { x: ownshipOverlaySide[0].segments[0].point.x, y: ownshipOverlaySide[0].segments[0].point.y },
                    { x: ownshipOverlaySide[0].segments[1].point.x, y: ownshipOverlaySide[0].segments[1].point.y }
                ]},
                { segments: [
                    { x: ownshipOverlaySide[1].segments[0].point.x, y: ownshipOverlaySide[1].segments[0].point.y },
                    { x: ownshipOverlaySide[1].segments[1].point.x, y: ownshipOverlaySide[1].segments[1].point.y }
                ]},
                { segments: [
                    { x: ownshipOverlaySide[2].segments[0].point.x, y: ownshipOverlaySide[2].segments[0].point.y },
                    { x: ownshipOverlaySide[2].segments[1].point.x, y: ownshipOverlaySide[2].segments[1].point.y }
                ]}
            ]    
        },
        final_res: finalRes,
        final_ac: finalAc
    };
    currentScenario.resolution = currentResolution;
    currentScenario.data_origin = 'JavaScriptInterface';
    allResolution[currentScenatioId - 1] = currentScenario;    
    console.log('A resolution saved...');
}


// Function to load saved resolution
function LoadSavedResolution(currentScenarioId) {    
    let idx = currentScenarioId - 1;
    if (!allResolution[idx]) {
        return
    }
    // Overlay
    // Load saved ownshipOverlaySide
    ownshipOverlaySide[1].segments = allResolution[idx].vertical.side[1].segments;
    ownshipOverlaySide[2].segments = allResolution[idx].vertical.side[2].segments;
    // Snap ownshipSide to ownshipOverlaySide    
    ownshipSide.segments[1].point = ownshipOverlaySide[1].segments[0].point; // handle 1 pos
    ownshipSide.segments[2].point = ownshipOverlaySide[1].segments[1].point; // handle 2 pos
    ownshipSide.segments[3].point = ownshipOverlaySide[2].segments[1].point; // exit point pos
    // Snap 2 handles positions to ownshipOverlaySide
    sideHandle1.position = ownshipSide.segments[1].point;
    sideHandle2.position = ownshipSide.segments[2].point;
    // Load saved ownshipOverlayTop
    ownshipOverlayTop[1].segments = allResolution[idx].vertical.top[1].segments;
    ownshipOverlayTop[2].segments = allResolution[idx].vertical.top[2].segments;
    
    // Lateral resolution
    // Load saved lateral resolutions top
    ownshipLateralResTop.segments = allResolution[idx].lateral_blue.top.segments;
    intruderLateralResTop.segments = allResolution[idx].lateral_red.top.segments;
    
    // Load saved lateral resolutions side
    ownshipLateralResSide.children[0].segments = allResolution[idx].lateral_blue.side.segments;
    ownshipLateralResSide.children[1].position = allResolution[idx].lateral_blue.side.segments[1];  // turn point marker position in side view
    intruderLateralResSide.children[0].segments = allResolution[idx].lateral_red.side.segments;
    intruderLateralResSide.children[1].position = allResolution[idx].lateral_red.side.segments[1];  // turn point marker position in side view
    // Show all saved resolutions
    // blue one: ownship
    let condition = ownshipOverlaySide[1].lastSegment.point.y != ownshipSide.firstSegment.point.y;
    ownshipOverlaySide.map(function(element) { element.visible = condition; return element });
    ownshipOverlayTop.map(function(element) { element.visible = condition; return element });
    ownshipLateralResTop.visible = true;
    // red one: intruder
    intruderLateralResTop.visible = true;
    if (allResolution[idx].final_ac == 'ownship') {
        $('#prefer-ownship').prop('checked', true);
        $('#prefer-intruder').prop('checked', false);
    } else if (allResolution[idx].final_ac == 'intruder') {
        $('#prefer-ownship').prop('checked', false);
        $('#prefer-intruder').prop('checked', true);
    } else {
        $('#prefer-ownship').prop('checked', false);
        $('#prefer-intruder').prop('checked', false);
    }
}


//  Download resolution
function DownloadResolution() {    
    let downloadData = {
        data_source_id: currentDBName,
        data: allResolution
    }    
    downloadData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allResolution));
    $('#download-link')[0].href = 'data:' + downloadData; 
    $('#download-link')[0].download = currentDBName + '_resolution.json'; 
    $('#download-link')[0].click();
}


// Animation
function MoveAircraft(type, percent) {
    let distance;
    if (type === 'conflict') {
        distance = ownshipTop.length; 
    }
    if (type === 'resolution') {
        distance = ownshipLateralResTop.length;
    }
    let offset = distance * percent / 100;
    ownshipFly.visible = true;
    intruderFly.visible = true;
    intruderFly.position = intruderTop.getPointAt(offset);
    if (type === 'conflict') {        
        ownshipFly.position  = ownshipTop.getPointAt(offset);
    }
    if (type === 'resolution') {        
        ownshipFly.position  = ownshipLateralResTop.getPointAt(offset);
    } 
    for (let i=0; i<surroundingFlight; i++) {
        try {
            surroundingFly[i].visible = true;
            surroundingFly[i].strokeColor = srdFlightTop[i].strokeColor; 
            surroundingFly[i].position = srdFlightTop[i].getPointAt(offset);           
        }
        catch (err) {
            console.log(err);
        }        
    }
}


// ========================================
// Show time when dragging
function ShowTime(seconds) {
    let min = math.floor(seconds / 60);
    let sec = seconds % 60;
    if (min == 0) {
        return (sec.toString().padStart(2,'0') + ' sec').padStart(13, ' ');    
    }
    return min.toString().padStart(2,'0') + ' min ' + sec.toString().padStart(2,'0') + ' sec';
}


// ========================================
// Function to reorder elements (z-order)
function ReorderElement() {
    // Top View Area

    // Side View Area

}

// =========================================
// Function to update setting
function UpdateSetting(settingName, value) {
    setting[settingName] = value;
    ReadSetting();    
}

Reset();