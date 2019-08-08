// ====================================================================================
// DOM behavioral functions

$('#current-climb-rate').html($('#climb-rate').val());


// Update setting button
$('#update-setting-btn').click(function ButtonUpdateSetting(){
    UpdateSetting();
})

// File input button
$('#input-file').change(function ButtonInputFile() {
    $('#start-id').val('');
    $('#current-id').val('');
    $('#total-scen').val(0);
    allScen = [];
    currentDBName = $('#input-file')[0].files[0].name; 
    let rawData;
    let reader = new FileReader();
    reader.onload = function() {
        rawData = this.result;
        allScen = JSON.parse(rawData);        
        allScen.map(function(element) { return ParseScenarioData(element) } );        
        currentScenarioId = 0;    
        $('#all-scen').html(allScen.length);
        $('#current-scen').val(0);
        showConflictIndicator = true;
        visual_indicator_cover.visible = false;
        console.log('Finished loading data of ' + allScen.length + ' scenarios.');
        $('#next-btn').prop('disabled', false);           
        $('#prev-btn').prop('disabled', false);
        $('#prefer-lateral').prop('checked', false);
        $('#prefer-lateral').prop('disabled', true);
        $('#prefer-vertical').prop('checked', false);
        $('#prefer-vertical').prop('disabled', true);
        Reset();
        demoMode = false;
    }
    let file = $('#input-file')[0].files[0];
    reader.readAsText(file);
})

function LoadDemoData (id){
    allResolution = [];
    switch (id) {
        case 1:
            allScen = demo_data_1;                        
        case 2:
            allScen = demo_data_2;
        case 3:
            allScen = demo_data_3;
    } 
    currentScenarioId = 0;    
    allScen.map(function(element) { return ParseScenarioData(element) } );        
    $('#all-scen').html(allScen.length);
    $('#all-scen-btn').html(allScen.length);
    $('#current-scen').val(0);
    $('#current-scen-btn').html(0);
    showConflictIndicator = true;
    visual_indicator_cover.visible = false;
    console.log('Finished loading data of ' + allScen.length + ' scenarios.');
    $('#next-btn').prop('disabled', false);           
    $('#prev-btn').prop('disabled', false);
    Reset();  
    demoMode = true; 
    $('#demo-id').html(id.toString());
    all_simple_res.demo_id = id;
    grayout_button(1);
    grayout_button(2);
    grayout_button(3);
    hightlight_button(id);
}

// Next button
$('#next-btn').click(function ButtonNext() {        
    if (currentScenarioId === allScen.length) {
        return
    }
    if (!demoMode) {
        $('#next-btn').prop('disabled', true);           
        $('#prev-btn').prop('disabled', true);
    } else {
        SaveResolution(currentScenarioId); 
    }          
    Reset();    
    currentScenarioId += 1;
    ShowAScenario(currentScenarioId); 
    $('#lateral-sep').prop('disabled', false);  
    $('#lateral-sep').prop('checked', false);  
    $('#vertical-sep').prop('disabled', false);    
    $('#vertical-sep').prop('checked', false);  
    $('#prefer-lateral').prop('checked', false);
    $('#prefer-lateral').prop('disabled', true);
    $('#prefer-vertical').prop('checked', false);
    $('#prefer-vertical').prop('disabled', true);

})

// Previous button
$('#prev-btn').click(function ButtonPrevious() {
    if (currentScenarioId <= 1) {
        return
    }
    Reset();    
    currentScenarioId -= 1;
    ShowAScenario(currentScenarioId);
    $('#lateral-sep').prop('disabled', false);  
    $('#vertical-sep').prop('disabled', false);
    $('#lateral-sep').prop('checked', false);  
    $('#vertical-sep').prop('checked', false); 
    $('#prefer-lateral').prop('checked', false);
    $('#prefer-lateral').prop('disabled', true);
    $('#prefer-vertical').prop('checked', false);
    $('#prefer-vertical').prop('disabled', true);
    if (!demoMode) {
        $('#next-btn').prop('disabled', true);           
        $('#prev-btn').prop('disabled', true);
    }
})

// Current scenario input 
$('#current-scen').on('change', function SpecifyScenarioNumber() {
    Reset();
    currentScenarioId = parseInt($('#current-scen').val());
    ShowAScenario(currentScenarioId);
    $('#lateral-sep').prop('disabled', false);  
    $('#vertical-sep').prop('disabled', false);
    $('#lateral-sep').prop('checked', false);  
    $('#vertical-sep').prop('checked', false);    
    StopPlayingResolution();
    $('#current-scen-btn').html($('#current-scen').val());
})

// ========================================================
// Record resolutions history
$('#show_res_history').change(function ShowResolutionHistory(){
    showResolutionHistory = $('#show_res_history').prop('checked');
    if (showResolutionHistory) {
        LoadSavedResolution(currentScenarioId);
    } else {
        
    }
})


// =========================================================
// Separation selection
$('#lateral-sep').click(function ButtonRadioLateralSep() {
    EnableVerticalSeparation(false);
})

$('#vertical-sep').click(function ButtonRadioVerticalSep() {
    EnableVerticalSeparation(true);  
})


// Climb rate selection
// $('#climb-rate').change(function SelectClimbRate() {
//     climbRate = $('#climb-rate').val() / 60; // feet per seconds    
//     let levelIncrement = math.round(sideHandle2.position.y - sideHandle1.position.y) / sideLevelStep;
//     let time2newlevel = math.abs(levelIncrement * 100) / climbRate;
//     let x = sideHandle1.position.x + commonSpeed * time2newlevel;
//     if (x < ownshipSide.lastSegment.point.x) {
//         sideHandle2.position.x = x;
//         handleDistanceX = sideHandle2.position.x - sideHandle1.position.x;
//         ownshipOverlaySide[1].lastSegment.point = sideHandle2.position;
//         ownshipOverlaySide[2].firstSegment.point = sideHandle2.position;
//         ownshipSide.segments[2].point = sideHandle2.position;
//         ownshipOverlayTop[1].segments = [
//             ownshipTop.getPointAt(sideHandle1.position.x - sideViewOrigin.x), 
//             ownshipTop.getPointAt(sideHandle2.position.x - sideViewOrigin.x)
//         ];
//         ownshipOverlayTop[2].segments = [
//             ownshipTop.getPointAt(sideHandle2.position.x - sideViewOrigin.x),
//             ownshipTop.lastSegment.point
//         ];
//         // ownshipVerticalResTop is for detection of LOS during vertical separation
//         ownshipVerticalResTop.segments[1].point = ownshipOverlayTop[1].segments[0].point;
//         ownshipVerticalResTop.segments[2].point = ownshipOverlayTop[1].segments[1].point;
//         DectectAndShowVerticalLOS ();
//     }
// })


$('#climb-rate').on('input', function SliderClimbRate() {
    $('#current-climb-rate').html($('#climb-rate').val());
    climbRate = $('#climb-rate').val() / 60; // feet per seconds    
    let levelIncrement = math.round(sideHandle2.position.y - sideHandle1.position.y) / sideLevelStep;
    let time2newlevel = math.abs(levelIncrement * 100) / climbRate;
    let x = sideHandle1.position.x + commonSpeed * time2newlevel;
    if (x < ownshipSide.lastSegment.point.x) {
        sideHandle2.position.x = x;
        handleDistanceX = sideHandle2.position.x - sideHandle1.position.x;
        ownshipOverlaySide[1].lastSegment.point = sideHandle2.position;
        ownshipOverlaySide[2].firstSegment.point = sideHandle2.position;
        ownshipSide.segments[2].point = sideHandle2.position;
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
    }
}) 

// =========================================================
// Run conflict slider
$('#run-conflict').on('input',function SliderRunConflict() {
    MoveAircraft('conflict', this.value);
})

$('#run-conflict').on('keyup mouseup', function SliderRunConflictRelease() {
    surroundingFly.map(function(element){
        element.visible = false;
    })
    intruderFly.visible = false;   
    ownshipFly.visible = false;
})  

// Run resolution slider
$('#run-resolution').on('input', function SliderRunResolution() {
    MoveAircraft('resolution', this.value);
})

$('#run-resolution').on('keyup mouseup', function SliderRunResolutionRelease() {
    surroundingFly.map(function(element){
        element.visible = false;
    })
    intruderFly.visible = false;   
    ownshipFly.visible = false;
})  


// =========================================================
// Resolution submission
$('#prefer-lateral').change(function() {
    finalRes = 'lateral';
    SaveResolution(currentScenarioId);
    $('#next-btn').prop('disabled', false);           
    $('#prev-btn').prop('disabled', false);
})

$('#prefer-vertical').change(function() {
    finalRes = 'vertical';
    SaveResolution(currentScenarioId);
    $('#next-btn').prop('disabled', false);           
    $('#prev-btn').prop('disabled', false);
})

$('#download-resolution').click(function ButtonDownloadResolution() {    
    DownloadResolution();
})


// ==========================================================
// Show view section

$('#show-top-view').change(function ShowTopView(){
    topViewCover.visible = !$('#show-top-view').is(':checked');
})

$('#show-side-view').change(function ShowTopView(){
    sideViewCover.visible = !$('#show-side-view').is(':checked');
    sideVerticalLine.visible = $('#show-side-view').is(':checked');
})

$('#show-3d-view').change(function ShowTopView(){
    Show3d(!show3DState);
})


function hightlight_button(id) {
    var btn = "#demo-" + id.toString() + "-btn";
    $(btn).removeClass("btn-info");
    $(btn).addClass("btn-warning");    
}

function grayout_button(id) {
    var btn = "#demo-" + id.toString() + "-btn";
    $(btn).removeClass("btn-warning");
    $(btn).addClass("btn-info");    
}


$('#current-scen-btn').html(0);
$('#all-scen-btn').html(0);