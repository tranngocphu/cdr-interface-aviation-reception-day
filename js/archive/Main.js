// MOUSE DRAG HANDLERS
var resTool = new Tool();
resTool.minDistance = 1; // in points
var dragCount = 0;
resTool.onMouseDown = function (event) {
    if (mouseDisabled[0] && mouseDisabled[1] && mouseDisabled[2] && mouseDisabled[3]) {
        return false
    } 
    vs.StopAnimation();
    // currentClosure.visible = false;
}

resTool.onMouseUp = function (event) {
    if (!allowPathChange) {
        return
    }
    if (selectedIdx !== null) {
        if (trigger) {
            SendHardTrigger(FinalDecision);
        } 
        onTime = true;         
        selectedIdx = null; // reset selection indicator         
        // If mouseUp from dragging a path, reach final resolution        
        var numOfRes = scenResolution.length;
        var allPairScore = 0;
        for (var i=0; i<numOfPair; i++) {
            scenResolution[numOfRes - 1].ModifiedPair[i].Category = 'final';
            allPairScore += scenResolution[numOfRes - 1].ModifiedPair[i].TotalScore;
        }
        currentScore = allPairScore / numOfPair;  
        UpdateScore();      
        // mouseDisabled.fill(true); 
        if (autoNext) {
            $('#next-btn').click();
        }        
    }
}

resTool.onMouseDrag = function (event) {
    if (!allowPathChange) {
        return
    }
    if (selectedIdx == 0) {
        return
    }
    if (selectedIdx == null || mouseDisabled[selectedIdx]) {
        console.log('Free dragging...');
        return        
    }
    cpaVisible = setting.live_cpa;
    // arrow.map(function(element) { element.remove(); return element } )
    var pointer = event.point;
    if (pointer.getDistance(view.center) <= mapSectorSize) {        
        scenario.ModifiedFlight[selectedIdx].IsModified = true;
        if (modPath[selectedIdx].Path.segments.length == 2) {
            modPath[selectedIdx].Path.insert(1, pointer);            
        }
        modPath[selectedIdx].Path.segments[1].point = pointer;        
        scenario.ModifiedFlight[selectedIdx].AddedPoint.radius = GetPolarCoord(pointer).radius;
        scenario.ModifiedFlight[selectedIdx].AddedPoint.angle = GetPolarCoord(pointer).angle;
        scenario.ModifiedFlight[selectedIdx].AddedPoint.x = pointer.x;
        scenario.ModifiedFlight[selectedIdx].AddedPoint.y = pointer.y;        
        var i = selectedIdx;
        for (var j=0; j<n; j++) {
            var k;
            if (j != i) {
                if (i < j) { 
                    k = liveCpaIdx[i][j]; 
                }
                else { 
                    k = liveCpaIdx[j][i]; 
                }                
                scenario.ModifiedPair[k].Category = 'intermediate';
                scenario.ModifiedPair[k].ModifiedFlightIdx = i;
                var hasConflict = ConflictDetector(modPath[i], modPath[j], k);
                SegmentCutBorderSector(hasConflict[3], hasConflict[4], cpaLineExtension);
                scenario.ModifiedPair[k].HasCPA = hasConflict[0];               
                var score = CalculateScore(i, j);
                scenario.ModifiedPair[k].Deviation.SetValue(score.Deviation.value);
                scenario.ModifiedPair[k].Deviation.SetScore(score.Deviation.score);
                scenario.ModifiedPair[k].TurningAngle.SetValue(score.TurningAngle.value);
                scenario.ModifiedPair[k].TurningAngle.SetScore(score.TurningAngle.score);
                scenario.ModifiedPair[k].CalculateTotalScore();
                if (scenario.ModifiedPair[k].HasCPA) {
                    scenario.ModifiedPair[k].TotalScore = 0;        
                }
            }
        }

		// Show 3 turning angle
		var str = '<br>';
		str += scenario.ModifiedPair[0].TurningAngle.Value[0].toFixed(2).toString() + '<br/>';
		str += (180 - scenario.ModifiedPair[0].TurningAngle.Value[1]).toFixed(2).toString() + '<br/>';
		str += scenario.ModifiedPair[0].TurningAngle.Value[2].toFixed(2).toString() + '<br/>';
		$('#three-angle').html(str);

        // Use stringify and parse to perform ALTUAL COPY of oject, otherwise "=" operator simply makes a REFERENCE
        scenResolution.push(JSON.parse(JSON.stringify(scenario)));  
        if (debugMode) {
            // console.log(scenario.ModifiedFlight);
        }
    }
}
// MAIN PROCEDURE BEGINS FROM HERE
// inputSubjectName();
ViewSector();

$('#speed-changer').on('input', function() {    
    view.pause();
    aircraft.map(function(element) { element.position = hidden; return element });
    speedRatio = this.value;
    $('#speed-ratio').html(speedRatio);
    DrawVelArrow(oriPath[1].Path.firstSegment.point, oriPath[1].Path.getPointAt(initialSpeed * speedRatio), 1);
    var cpaStatus = CpaCalulator1(syncPoint.position, oriPath[0].Path.lastSegment.point, 
        oriPath[1].Path.firstSegment.point, oriPath[1].Path.lastSegment.point,
        initialSpeed, initialSpeed * speedRatio
    );
    var k = 0;
    if (cpaStatus[0]) {
        cpaLine[k].segments = [cpaStatus[3], cpaStatus[4]];
        cpaCircle[k].position = cpaLine[k].getPointAt(0.5 * cpaLine[k].length);
        cpaLine[k].visible = cpaVisible;
        cpaCircle[k].visible = cpaVisible;
        if (debugMode) {
            console.log('Flights', 0, 1, 'Ownship[0] vs Intruder[0] CPA detected:', cpaStatus);
        }
    }
    else {
        cpaLine[k].visible = false;
        cpaCircle[k].visible = false;    
    }
}) 

function GenerateScenData(m) {
    n = 2;
    generationCounter = 0;
    losVisible = true;
    cpaVisible = true;
    syncPointVisible = true;
    feedbackVisible = true;
    autoplayConflict = false;
    autoplayResolution = false;
    dataRecording = true;
    playSpeed = 2;    
    for (var i=1; i<=m; i++) {        
        AfterGetSetting();
    }
}