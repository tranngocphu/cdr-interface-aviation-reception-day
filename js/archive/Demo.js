var ctx1 = $("#chart-1");
var ctx2 = $("#chart-2");

var trainingData;
var trainingPath;
var middlePoint;
var stepIdx = 0;
var intervalDuation = 600;
var demoInterval = null;

var testingData;
var testIdx = -1;

var task;

$('#input-training').change(function() {
    // Clear sector map
    oriPath.map(function(element){
        element.Path.segments = [];
        return element
    })
    modPath.map(function(element){
        element.Path.segments = [];
        return element
    })
    entryMarker.map(function(element){
        element.position = hidden;
        return element
    })
    Reset();          
    task = 'training';    
    var trainId = parseInt($('#input-training').val());    
    trainingData = train[trainId];                        
    LoadConflict(0);
    trainingPath = new Array(trainingData.length);
    middlePoint  = new Array(trainingData.length);
})

$('#input-testing').click(function() {
    oriPath.map(function(element){
        element.Path.segments = [];
        return element
    })
    modPath.map(function(element){
        element.Path.segments = [];
        return element
    })
    entryMarker.map(function(element){
        element.position = hidden;
        return element
    })
    heatMap.map(function(element){
        element.visible = false;
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
    $('#test-case').html('');
    task = 'testing';
    testIdx = -1;
    view.pause();
    testingData = test;
    testingData.splice(48, 1);
    testingData.splice(61, 1);
    allScen = testingData;
    allowPathChange = true; 
})

var rewardChartConfig = {
    type : 'line',
    data : {
        labels: [],
        datasets: [{
            label: "REWARD PLOT",
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderColor: 'rgba(0, 0, 0, 0.2)',
            data: [],
            lineTension: 0,
            pointBackgroundColor: []
        }],    
    },
    options : {
        title: {
            display: true,
            position: 'top',
            fontSize: 14,
            text: 'CURRENT REWARD'
        },
        legend: {
            display: false
        },
        elements : {
            point : {
                pointStyle: 'circle',
                radius: 6
            }
        }
    }
}

var avgRewardChartConfig = {
    type : 'line',
    data : {
        labels: [],
        datasets: [{
            label: "REWARD PLOT",
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderColor: 'rgba(0, 0, 0, 0.2)',
            data: [],
            lineTension: 0,
            pointBackgroundColor: []
        }],    
    },
    options : {
        title: {
            display: true,
            position: 'top',
            fontSize: 14,
            text: 'MODEL PERFORMANCE'
        },
        legend: {
            display: false
        },
        elements : {
            point : {
                pointStyle: 'circle',
                radius: 6
            }
        }
    }
}

var rewardChart    = new Chart(ctx1, rewardChartConfig)
var avgRewardChart = new Chart(ctx2, avgRewardChartConfig)


// =========================================================

function addDataPoint(chart, chartConfig, dataSetId, x, y) {
    var currentLength = chartConfig.data.labels.length;
    var newLength = currentLength + 1;
    chartConfig.data.labels.push((currentLength + 1).toFixed(0).toString());
    chartConfig.data.datasets[dataSetId].data.push(y);  
    chartConfig.data.datasets[dataSetId].pointBackgroundColor.fill('rgb(255, 187, 102)');
    chartConfig.data.datasets[dataSetId].pointBackgroundColor[newLength-1] = 'rgb(0, 100, 0)';
    chart.update();
} 

function clearChart(chart, chartConfig, dataSetId) {
    chartConfig.data.labels = [];
    chartConfig.data.datasets[dataSetId].data = [];
    // chartConfig.data.datasets[dataSetId].pointBackgroundColor.fill('rgb(255, 187, 102)');
    // chartConfig.data.datasets[dataSetId].pointBackgroundColor[newLength-1] = 'rgb(0, 100, 0)';
    chart.update();
} 


function ShowTraining(idx) {    
    if (idx > 0) {
        trainingPath[idx-1].strokeColor = orange;
        trainingPath[idx-1].strokeWidth = vs.FlightStroke - 3;
        trainingPath[idx-1].addTo(vs.ObjLayer);
        middlePoint[idx-1].scale(0.5);
        middlePoint[idx-1].fillColor = orange;
    }
    var entry  = [trainingData[idx].entry_x_1,     trainingData[idx].entry_y_1];
    var exit   = [trainingData[idx].exit_x_1,      trainingData[idx].exit_y_1];
    var middle = [trainingData[idx].added_point_x, trainingData[idx].added_point_y];
    vs.TopLayer.activate();  
    trainingPath[idx] = new Path.Line({
        segments: [
            new Point(entry), 
            new Point(middle), 
            new Point(exit)
        ],
        strokeWidth: vs.FlightStroke + 2,
        strokeColor: green,
        dashArray: vs.DashLineStyle
    });
    modPath[1].Path.segments = trainingPath[idx].segments;
    middlePoint[idx] = new Path.Circle({
        center: trainingPath[idx].segments[1].point,
        radius: vs.FlightStroke + 6,
        fillColor: green,
        strokeWidth: 0
    });    
    addDataPoint(rewardChart,    rewardChartConfig,    0, '', trainingData[idx].Reward / 2);
    addDataPoint(avgRewardChart, avgRewardChartConfig, 0, '', trainingData[idx].Loss / 2);
    return idx + 1;
}

function Stop(idx, stopIdx, interval) {
    if (idx == stopIdx) {
        clearInterval(interval);
        $('#demo-btn').prop('disabled', false);
    }
}

function Demo() {
    Reset(); 
    demoInterval = setInterval("console.log(stepIdx); stepIdx = ShowTraining(stepIdx); Stop(stepIdx, trainingData.length, demoInterval);", intervalDuation);
}

function Reset() {
    if (demoInterval) {
        clearInterval(demoInterval);
    }
    clearChart(rewardChart, rewardChartConfig, 0);
    clearChart(avgRewardChart, avgRewardChartConfig, 0);
    if (trainingPath) {
        trainingPath.map(function(element){
            element.visible = false;
            return element
        })
    }
    if (middlePoint) {
        middlePoint.map(function(element){
            element.visible = false;
            return element
        })
    }
    stepIdx = 0;    
    console.clear();   
    $('#demo-btn').prop('disabled', false);
}

$('#demo-btn').click(function(){    
    Demo();
    $('#demo-btn').prop('disabled', true);
})

$('#reset-training-btn').click(function(){
    $('#demo-btn').prop('disabled', false);
    Reset();
})

function LoadConflict (id) {
    currentScenId = id + 1;
    ResetVars();
    if (trainingData) {
        var scen = trainingData[id];
    }
    if (testingData) {
        var scen = testingData[id];
    }
    console.log(scen);
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
    
    for (var i=0; i<2; i++) {
        entryMarker[i].position = oriPath[i].Path.firstSegment.point;
        entryMarker[i].visible = true;    
    }    
    
    cpaVisible = true;    
    ShowCurrentConflictLine();
    if (task == 'testing') {
        PostGenerationTask();   
    }
}

var heatMapLocation = heatMapLocationXY;
var heatMap = new Array(heatMapLocation.length);
for (var i=0; i<heatMapLocation.length; i++) {
    heatMap[i] = new Path.Circle({
        center: new Point([heatMapLocation[i].x, heatMapLocation[i].y]),
        radius: 3,
        visible: false
    })
}
function DrawHeatMap(id) {
    var mapVal = JSON.parse(testingData[id].heat_map);
    for (var i=0; i<heatMap.length; i++) {
        heatMap[i].opacity = 1;
        heatMap[i].visible = true;
        if (mapVal[i].conflict) {
            heatMap[i].fillColor = redLight;
        } else {
            var closure = mapVal[i].cpa_closure;
            heatMap[i].fillColor =  orange;
            heatMap[i].opacity = closure/300;
        }
    }

}

$('#next-scen-btn').click(function(){
    view.pause();
    testIdx += 1;    
    $('#back-scen-btn').prop('disabled', false);
    if (testIdx == testingData.length-1) {
        $('#next-scen-btn').prop('disabled', true);
    }       
    LoadConflict(testIdx);
    $('#test-case').html(testIdx);
    var midPoint = new Point([testingData[testIdx].added_point_x, testingData[testIdx].added_point_y]);
    modPath[1].Path.segments[1].point = midPoint;    
    modPath[1].Path.visible = true; 
    DrawHeatMap(testIdx);
})

$('#back-scen-btn').click(function(){
    view.pause();    
    testIdx -= 1;
    $('#next-scen-btn').prop('disabled', false);
    if (testIdx == 0) {
        $('#back-scen-btn').prop('disabled', true);
    }    
    LoadConflict(testIdx);
    $('#test-case').html(testIdx);
    var midPoint = new Point([testingData[testIdx].added_point_x, testingData[testIdx].added_point_y]);
    modPath[1].Path.segments[1].point = midPoint;    
    modPath[1].Path.visible = true; 
    DrawHeatMap(testIdx);
})