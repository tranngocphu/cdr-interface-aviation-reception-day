// ===========================================
// GLOBAL MOUSE HANDLES

// Mouse control variables
sideHandle1Enable = true;
sideHandle2Enable = true;

let inputTool = new Tool();
inputTool.minDistance = 0; // in points


// =======================================
// GLOBAL MOUSE HANDLERS
// =======================================
inputTool.onMouseDown = function GlobalMouseDown(event) { 
    if ( resolutionIsRunning ) {
        StopPlayingResolution();
    }
}

// inputTool.onMouseMove = function GlobalMouseMove (event) { 
//     if (event.point.x >= sideViewOrigin.x) {
//         sideVerticalLine.position.x = event.point.x - 1;
//         sideVerticalLine.children[1].content = ShowTime(math.round((event.point.x - sideViewOrigin.x) / commonSpeed));
//     }
// }

inputTool.onMouseDrag = function GlobalMouseDrag (event) { 
    if (performingLateralSeparation & sectorBorder.position.getDistance(event.point) <= sectorRadius) {
        lockLineWidth = true;
        ownshipLateralResTop.segments[1].point = event.point;
        ownshipLateralResSide.children[0].segments[0].point = ownshipSide.firstSegment.point;   
        ownshipLateralResSide.children[0].segments[1].point = ownshipSide.firstSegment.point.add(ownshipLateralResTop.firstCurve.length, 0);
        ownshipLateralResSide.children[0].segments[2].point = ownshipSide.firstSegment.point.add(ownshipLateralResTop.length, 0);
        ownshipLateralResSide.children[1].position = ownshipLateralResSide.children[0].segments[1].point;
        ownshipLateralResSide.visible = true;
        hasLateralRes = true;
        $('#prefer-lateral').prop('disabled', false);
        DectectAndShowLateralLOS();
        // SaveResolution(currentScenarioId);        
    }
}

inputTool.onMouseUp = function GlobalMouseUp (event) {
    sideHandle1Enable = true;
    sideHandle2Enable = true;    
    lockLineWidth = false;
    if ( performingLateralSeparation ) {
        performingLateralSeparation = false;  
        AutoPlayResolution();
    }
}


// =======================================
// GLOBAL KEY HANDLERS
// =======================================
inputTool.onKeyDown = function GlobalKeyDown (event) {
    switch (event.key) {        
        case 'q':
            viewLink.map(function(element){
                element.visible = !element.visible;                
                return element
            })
            break        
        case 'w':
            topFinishLevelChange.map(function(element){
                element.visible = !element.visible;
                return element
            }) 
            break        
        case 'x':
            if (!$('#next-btn').is(':checked')) {
                break
            }
            $('#next-btn').click();
            break        
        case 'z':
            if (!$('#prev-btn').is(':checked')) {
                break
            }
            $('#prev-btn').click();
            break
        case 'a':
            $('#lateral-sep').click();
            break
        case 's':
            $('#vertical-sep').click();
            break
        case 'l':
            $('#demo-data').click();
    }
}


// =====================================================================
// LATERAL SEPARATION 
// =====================================================================
// OWNSHIP TOP
ownshipTop.onMouseEnter = function ownshipTopMouseEnter (event) {
    if (lateralSeparation) {
        this.strokeWidth = 1.5 * lineWidth.ownship; 
    }    
}

ownshipTop.onMouseLeave = function ownshipTopMouseLeave (event) {
    this.strokeWidth = lineWidth.ownship;    
}

ownshipTop.onMouseDown = function ownshipTopMouseDown (event) {
    if (lateralSeparation) {
        performingLateralSeparation = true;
        ownshipLateralResTop.visible = true;    
    }
}

ownshipLateralResTop.onMouseDown = function ownshipLateralResMouseDown (event) {
    if (lateralSeparation) {
        performingLateralSeparation = true;
    }       
}

ownshipLateralResTop.onMouseEnter = function ownshipLateralResMouseEnter (event) {
    if (!lockLineWidth & lateralSeparation) {
        this.strokeWidth = lineWidth.ownship * 1.5;
    } 
    if ( resolutionIsRunning ) {
        PausePlayingResolution();
    }    
}

ownshipLateralResTop.onMouseLeave = function ownshipLateralResMouseLeave (event) {
    this.strokeWidth = lineWidth.ownship * 0.5;
    if ( resolutionPlayingPaused && resolutionIsRunning ) {
        ResumePlayingResolution();
    }
}

// =====================================================================
// VERTICAL SEPARATION 
// =====================================================================
// TWO HANDLES FOR VERTICAL SEPARATION
// Handle 1: determine when to start vertical separation
sideHandle1.onMouseDrag = function sideHandle1MouseDrag (event) {    
    if ( !sideHandle1Enable ) {
        return
    }
    sideHandle2Enable = false;    
    let condition = event.point.x >= ownshipSide.segments[0].point.x && event.point.x + handleDistanceX <= ownshipSide.lastSegment.point.x;
    if ( condition ) {
        // if conditions to ensure two handles are still within the path of ownship side       
        sideVerticalLine.position.x = event.point.x - 1;
        sideVerticalLine.children[1].content = ShowTime(math.round((event.point.x - sideViewOrigin.x) / commonSpeed));
        ownshipSide.segments[1].point.x = event.point.x;
        ownshipSide.segments[2].point.x = ownshipSide.segments[1].point.x + handleDistanceX;
        sideHandle1.position = ownshipSide.segments[1].point;
        sideHandle2.position = ownshipSide.segments[2].point;        
        let newLevelOffset = sideHandle2.position.x - sideViewOrigin.x; // distance from entry point to beginning at new level
        for (let i=0; i<srdFlightTop.length; i++) {
            topFinishLevelChange[i].strokeColor  = srdFlightTop[i].strokeColor;
            topFinishLevelChange[i].position     = srdFlightTop[i].getPointAt(newLevelOffset);
        }
        ownshipOverlaySide[1].segments = [sideHandle1.position, sideHandle2.position];
        ownshipOverlaySide[2].segments = [sideHandle2.position, ownshipSide.lastSegment.point];         
        ownshipOverlayTop[1].segments = [
            ownshipTop.getPointAt(sideHandle1.position.x - sideViewOrigin.x), 
            ownshipTop.getPointAt(sideHandle2.position.x - sideViewOrigin.x)
        ];
        ownshipOverlayTop[2].segments = [
            ownshipTop.getPointAt(sideHandle2.position.x - sideViewOrigin.x), 
            ownshipTop.lastSegment.point
        ];
        ownshipVerticalResTop.segments[1].point = ownshipOverlayTop[1].segments[0].point;
        ownshipVerticalResTop.segments[2].point = ownshipOverlayTop[1].segments[1].point;
        DectectAndShowVerticalLOS ();
        // SaveResolution(currentScenarioId);        
    }   
}

// Handle 2: determine when to arrive at new flight level
sideHandle2.onMouseDrag = function sideHandle2MouseDrag (event) {  
    if ( !sideHandle2Enable || climbRate == 0 ) {
        return
    } 
    sideHandle1Enable = false; // disable hande1 mouse action when dragging hande2
    let condition1 = event.point.x >= sideHandle1.position.x && event.point.x <= ownshipSide.lastSegment.point.x;
    let condition2 = event.point.y <= flightLevel[0] && event.point.y >= flightLevel[flightLevel.length-1];
    if ( condition1 && condition2 ) {
        sideVerticalLine.position.x = event.point.x - 1;
        sideVerticalLine.children[1].content = ShowTime(math.round((event.point.x - sideViewOrigin.x) / commonSpeed));
        let newFL = math.round( (event.point.y.transY() - sideViewOrigin.y) / sideLevelStep );
        ownshipNewPointLevel = newFL * 100 * feet2nm * nm2point;
        let levelIncrement = newFL - ownshipLevel;
        let time2newlevel = math.abs(levelIncrement * 100) / climbRate; // in seconds
        $('#level-change').html(( levelIncrement <= 0 ? "" : "+" ) + ( levelIncrement * 100).toString() + ' ft');
        let newLevelArrive = event.point.x - ownshipSide.firstSegment.point.x; // distance from entry point to beginning at new level
        event.point.y = flightLevel[newFL];
        let x = sideHandle1.position.x + commonSpeed * time2newlevel;
        if (x > ownshipSide.lastSegment.point.x) {
            return
        }        
        event.point.x = sideHandle1.position.x + commonSpeed * time2newlevel;
        ownshipSide.segments[2].point = event.point; // arrival point at new level
        ownshipSide.segments[3].point.y = flightLevel[newFL]; // y level of exit point in side view               
        sideHandle2.position = ownshipSide.segments[2].point; // snap handle 2 to new level arriaval point
        handleDistanceX = sideHandle2.position.x - sideHandle1.position.x;
        for (let i=0; i<srdFlightTop.length; i++) {
            topFinishLevelChange[i].strokeColor  = srdFlightTop[i].strokeColor;
            topFinishLevelChange[i].position     = srdFlightTop[i].getPointAt(newLevelArrive);
        }
        ownshipOverlaySide[1].segments = [sideHandle1.position, sideHandle2.position];
        ownshipOverlaySide[2].segments = [sideHandle2.position, ownshipSide.lastSegment.point];
        ownshipOverlayTop[1].segments = [
            ownshipTop.getPointAt(sideHandle1.position.x - sideViewOrigin.x), 
            ownshipTop.getPointAt(sideHandle2.position.x - sideViewOrigin.x)
        ];
        ownshipOverlayTop[2].segments = [
            ownshipTop.getPointAt(sideHandle2.position.x - sideViewOrigin.x),
            ownshipTop.lastSegment.point
        ];
        // ownshipVerticalResTop is for detection of LOS during vertical separation
        ownshipVerticalResTop.segments[1].point = ownshipOverlayTop[1].segments[0].point;
        ownshipVerticalResTop.segments[2].point = ownshipOverlayTop[1].segments[1].point;
        DectectAndShowVerticalLOS ();
        // if (newFL <= 14) {
        //     ownshipOverlaySide[2].strokeColor = color.lower; 
        //     ownshipOverlayTop[2].strokeColor  = color.lower;   
        // } else if (newFL <= 23) {
        //     ownshipOverlaySide[2].strokeColor = color.middle;    
        //     ownshipOverlayTop[2].strokeColor  = color.middle;    
        // } else {
        //     ownshipOverlaySide[2].strokeColor = color.upper;   
        //     ownshipOverlayTop[2].strokeColor  = color.upper;   
        // }
        hasVerticalRes = true;
        $('#prefer-vertical').prop('disabled', false);
    }  
}



// =====================================================================
// SHOW LINK BETWEEN VIEWS
// =====================================================================
srdEntryMarkerSide.map(function ShowViewLink (element) {
    element.onMouseDown = function (event) {
        viewLink[element.idx].visible = !viewLink[element.idx].visible;
    };
    return element
})
srdEntryMarkerTop.map(function ShowViewLink (element) {
    element.onMouseDown = function (event) {
        console.log(element.idx);
        // viewLink[element.idx].visible = !viewLink[element.idx].visible;
    };
    return element
})

// =====================================
// MAIN PROCEDURE BEGINS FROM HERE
// =====================================
// LoadScenarioData('3d_data.csv');  // lazy load