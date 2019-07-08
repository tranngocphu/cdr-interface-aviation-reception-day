let show3DState = false;
function Show3d(state) {
    if (state) {
        $('#visual-air-space').show();
    } else {
        $('#visual-air-space').hide();           
    }
    show3DState = state; 
}
Show3d($('#show-3d-view').is(':checked'));

// Scene important global variables

let cameraType = 1; // 0: perspective; 1: orthographic

let container, airspaceCanvas, stats;
let camera, scene, renderer;
let transformControl;
let viewWidth = window.innerWidth * 0.7;
let viewHeight = window.innerHeight * 0.9;

let zScale = 50;
let entrySphereRadius = 5;
let entrySphereColor = 0x000000;

// 3D object of all flights:
let srdFlightPathData = []; // store vertices of flight paths 
let srdFlightPath = [];     // 3d object of flight paths
let intruderFlightPath;
let ownshipFlightPath;
let ownshipLateralResPath;
let ownshipVerticalResPath;
let srdEntrySphere = [];
let intruderEntrySphere;
let ownshipEntrySphere;


function init() {

    container = document.getElementById('air-space-container');
    airspaceCanvas = document.getElementById('air-space');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    if (cameraType === 0) {
        camera = new THREE.PerspectiveCamera(50, viewWidth/viewHeight, 1, 10000);
        camera.up.set(0, 0, 1);
        camera.position.set(1500, 500, 1000);        
    }         
    if (cameraType === 1) {
        camera = new THREE.OrthographicCamera( - viewWidth * 0.5, viewWidth * 0.5, viewHeight * 0.5, -viewHeight * 0.5, -10000, 10000 );
        camera.up.set(0, 0, 1);
        camera.zoom = 1;
        camera.position.set(0, 0, 1000);           
    }
    scene.add(camera);

    // Light
    scene.add(new THREE.AmbientLight(0xf0f0f0));

    // Add axes
    let axes = new THREE.AxesHelper( 100 );
    axes.position.set( 0, 0, 0 );
    scene.add( axes );

    // Grid plane
    let helper = new THREE.GridHelper(2000, 50);
    helper.rotateX(-Math.PI / 2);
    helper.position.z = 0;
    helper.material.opacity = 0.5;
    helper.material.transparent = true;    
    scene.add(helper);

    // Primary renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: airspaceCanvas
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(viewWidth, viewHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Mouse controls of camera
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.damping = 0.2;
    controls.addEventListener('change', render);
    controls.addEventListener('start', function () {
        // cancelHideTransorm();
    });
    controls.addEventListener('end', function () {
        // delayHideTransform();
    });
    // Transform control makes orbits around origin
    transformControl = new THREE.TransformControls(camera, renderer.domElement);
    transformControl.addEventListener('change', render);
    scene.add(transformControl);
    // Hiding transform situation is a little in a mess :()
    // transformControl.addEventListener('change', function (e) {
    //     cancelHideTransorm();
    // });
    // transformControl.addEventListener('mouseDown', function (e) {
    //     cancelHideTransorm();
    // });
    // transformControl.addEventListener('mouseUp', function (e) {
    //     delayHideTransform();
    // });
    // transformControl.addEventListener('objectChange', function (e) {
    //     updateSplineOutline();
    // });
    // let hiding;
    // function delayHideTransform() {
    //     cancelHideTransorm();
    //     hideTransform();
    // }
    // function hideTransform() {
    //     hiding = setTimeout(function () {
    //         transformControl.detach(transformControl.object);
    //     }, 2500)
    // }
    // function cancelHideTransorm() {
    //     if (hiding) clearTimeout(hiding);
    // }
}


function animate() {
    // requestAnimationFrame(animate);
    render();
    // stats.update();
    transformControl.update();
}

function render() {
    renderer.render(scene, camera);
    transformControl.update();
}


// =====================================================
// Camrema manipulation
function CameraZoom(zoomFactor) {
    camera.zoom = zoomFactor;
    camera.updateProjectionMatrix();
    render();
}

// =====================================================
// Construct data for 3d visulization

function UpdatePathVertex(line, vertexIdx, newPosition) {
    line.geometry.verticesNeedUpdate = true;
    line.geometry.vertices[vertexIdx].x = newPosition[0];
    line.geometry.vertices[vertexIdx].y = newPosition[1];
    line.geometry.vertices[vertexIdx].z = newPosition[2];
}


// Surrounding flights

function InitializeSurroundingFligthPath() {
    for (let i=0; i<surroundingFlight; i++) {
        let material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
        geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
        srdFlightPath[i] = new THREE.Line( geometry, material );
        scene.add(srdFlightPath[i]);
    }
}

function InitializeEntry() {
    for (let i=0; i<surroundingFlight; i++) {
        let geometry = new THREE.SphereGeometry( entrySphereRadius, 32, 32 );
        let material = new THREE.MeshBasicMaterial( {color: entrySphereColor } );
        srdEntrySphere[i] = new THREE.Mesh( geometry, material );
        srdEntrySphere[i].position.x = -5000;
        srdEntrySphere[i].position.y = -5000;
        srdEntrySphere[i].position.z = -5000;
        scene.add(srdEntrySphere[i]);
    }
    geometry = new THREE.SphereGeometry( entrySphereRadius, 32, 32 );
    material = new THREE.MeshBasicMaterial( {color: entrySphereColor } );
    intruderEntrySphere = new THREE.Mesh( geometry, material );
    intruderEntrySphere.position.x = -5000;
    intruderEntrySphere.position.y = -5000;
    intruderEntrySphere.position.z = -5000;
    scene.add(intruderEntrySphere);
    geometry = new THREE.SphereGeometry( entrySphereRadius, 32, 32 );
    material = new THREE.MeshBasicMaterial( {color: entrySphereColor } );
    ownshipEntrySphere = new THREE.Mesh( geometry, material );
    ownshipEntrySphere.position.x = -5000;
    ownshipEntrySphere.position.y = -5000;
    ownshipEntrySphere.position.z = -5000;
    scene.add(ownshipEntrySphere);
}

function UpdateSurroundingFLightPath() {
    for (let i=0; i<surroundingFlight; i++) {
        let entry = [srdFlightTop[i].firstSegment.point.x, srdFlightTop[i].firstSegment.point.y.transY(), srdPointLevel[i] * zScale];
        let exit = [srdFlightTop[i].lastSegment.point.x,   srdFlightTop[i].lastSegment.point.y.transY(),  srdPointLevel[i] * zScale];
        UpdatePathVertex(srdFlightPath[i], 0, entry);
        UpdatePathVertex(srdFlightPath[i], 1, exit);
        srdEntrySphere[i].position.x = entry[0];
        srdEntrySphere[i].position.y = entry[1];
        srdEntrySphere[i].position.z = entry[2];
    }
}


// Intruder
function InitializeIntruderPath() {
    let material = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 3 } );
    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    intruderFlightPath = new THREE.Line( geometry, material );
    scene.add(intruderFlightPath);
}

function UpdateIntruderPath() {
    let entry = [intruderTop.firstSegment.point.x, intruderTop.firstSegment.point.y.transY(), intruderPointLevel * zScale];
    let exit = [intruderTop.lastSegment.point.x,   intruderTop.lastSegment.point.y.transY(),  intruderPointLevel * zScale];
    UpdatePathVertex(intruderFlightPath, 0, entry);
    UpdatePathVertex(intruderFlightPath, 1, exit);
    intruderEntrySphere.position.x = entry[0];
    intruderEntrySphere.position.y = entry[1];
    intruderEntrySphere.position.z = entry[2];
}


// Ownship
function InitializeOwnshipPath() {
    // original ownship
    let material = new THREE.LineBasicMaterial( { color: 0x006800 } );
    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    ownshipFlightPath = new THREE.Line( geometry, material );
    scene.add(ownshipFlightPath);
    // lateral resolution
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    ownshipLateralResPath = new THREE.Line( geometry, material );
    scene.add(ownshipLateralResPath);
    // vertical resolution
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
    ownshipVerticalResPath = new THREE.Line( geometry, material );
    scene.add(ownshipVerticalResPath);
}

function UpdateOwnshipPath() {
    let entry = [ownshipTop.firstSegment.point.x, ownshipTop.firstSegment.point.y.transY(), ownshipPointLevel * zScale];
    let exit = [ownshipTop.lastSegment.point.x,   ownshipTop.lastSegment.point.y.transY(),  ownshipPointLevel * zScale];
    UpdatePathVertex(ownshipFlightPath, 0, entry);
    UpdatePathVertex(ownshipFlightPath, 1, exit);
    ownshipEntrySphere.position.x = entry[0];
    ownshipEntrySphere.position.y = entry[1];
    ownshipEntrySphere.position.z = entry[2];
}

function UpdateOwnshipLateralResPath() {
    let entry  = [ownshipLateralResTop.firstSegment.point.x, ownshipLateralResTop.firstSegment.point.y.transY(), ownshipPointLevel * zScale];
    let middle = [ownshipLateralResTop.segments[1].point.x,  ownshipLateralResTop.segments[1].point.y.transY(),  ownshipPointLevel * zScale];
    let exit   = [ownshipLateralResTop.lastSegment.point.x,  ownshipLateralResTop.lastSegment.point.y.transY(),  ownshipPointLevel * zScale];
    UpdatePathVertex(ownshipLateralResPath, 0, entry);
    UpdatePathVertex(ownshipLateralResPath, 1, middle);
    UpdatePathVertex(ownshipLateralResPath, 2, exit);
    ownshipEntrySphere.position.x = entry[0];
    ownshipEntrySphere.position.y = entry[1];
    ownshipEntrySphere.position.z = entry[2];
}

function UpdateOwnshipVerticalResPath() {
    let entry   = [ownshipVerticalResTop.firstSegment.point.x, ownshipVerticalResTop.firstSegment.point.y.transY(), ownshipPointLevel * zScale];
    let handle1 = [ownshipVerticalResTop.segments[1].point.x,  ownshipVerticalResTop.segments[1].point.y.transY(),  ownshipPointLevel * zScale];
    let handle2 = [ownshipVerticalResTop.segments[2].point.x,  ownshipVerticalResTop.segments[2].point.y.transY(),  ownshipNewPointLevel * zScale];
    let exit    = [ownshipVerticalResTop.lastSegment.point.x,  ownshipVerticalResTop.lastSegment.point.y.transY(),  ownshipNewPointLevel * zScale];
    UpdatePathVertex(ownshipVerticalResPath, 0, entry);
    UpdatePathVertex(ownshipVerticalResPath, 1, handle1);
    UpdatePathVertex(ownshipVerticalResPath, 2, handle2);
    UpdatePathVertex(ownshipVerticalResPath, 3, exit);
    ownshipEntrySphere.position.x = entry[0];
    ownshipEntrySphere.position.y = entry[1];
    ownshipEntrySphere.position.z = entry[2];
}



// Apply to all flights

function RenderAllFlight() {
    UpdateSurroundingFLightPath();
    UpdateIntruderPath();
    UpdateOwnshipPath();
    ShowFlight(ownshipFlightPath);
    render();   
}

function ResetAllFlight() {
    let dummyPoint = [0, 0, 0];
    for (let i=0; i<surroundingFlight; i++) {        
        UpdatePathVertex(srdFlightPath[i], 0, dummyPoint);
        UpdatePathVertex(srdFlightPath[i], 1, dummyPoint);
        srdEntrySphere[i].position.x = -5000;
        srdEntrySphere[i].position.y = -5000;
        srdEntrySphere[i].position.z = -5000;
    }
    UpdatePathVertex(intruderFlightPath, 0, dummyPoint);
    UpdatePathVertex(intruderFlightPath, 1, dummyPoint);
    UpdatePathVertex(ownshipFlightPath, 0, dummyPoint);
    UpdatePathVertex(ownshipFlightPath, 1, dummyPoint);
    intruderEntrySphere.position.x = -5000;
    intruderEntrySphere.position.y = -5000;
    intruderEntrySphere.position.z = -5000;
    ownshipEntrySphere.position.x = -5000;
    ownshipEntrySphere.position.y = -5000;
    ownshipEntrySphere.position.z = -5000;
    UpdatePathVertex(ownshipLateralResPath, 0, dummyPoint);
    UpdatePathVertex(ownshipLateralResPath, 1, dummyPoint);
    UpdatePathVertex(ownshipLateralResPath, 2, dummyPoint);
    UpdatePathVertex(ownshipVerticalResPath, 0, dummyPoint);
    UpdatePathVertex(ownshipVerticalResPath, 1, dummyPoint);
    UpdatePathVertex(ownshipVerticalResPath, 2, dummyPoint);
    UpdatePathVertex(ownshipVerticalResPath, 3, dummyPoint);
    render();
}

function HideFlight(flight) {
    scene.remove(flight);
}

function ShowFlight(flight) {
    scene.add(flight);
}

// Main procedure
init();
// drawline(0, 0, 0);
// drawsphere(10, [500, 500, 300]);
CameraZoom(0.4);
InitializeSurroundingFligthPath();
InitializeIntruderPath();
InitializeOwnshipPath();
InitializeEntry();
render();


// =============================================
// Button functions

$('#render-lateral-res').click(function ButtonShowLateralResolution() {
    if ( !hasLateralRes ) {
        $('#3d-space-note').html('No lateral resolution found!');
        return
    }
    $('#3d-space-note').html('');
    HideFlight(ownshipFlightPath);
    HideFlight(ownshipVerticalResPath);
    UpdateOwnshipLateralResPath();
    ShowFlight(ownshipLateralResPath);
    render();
})

$('#render-vertical-res').click(function RenderVerticalResolution() {
    if ( !hasVerticalRes ) {
        $('#3d-space-note').html('No vertical resolution found!');
        return
    }
    $('#3d-space-note').html('');
    HideFlight(ownshipFlightPath);
    HideFlight(ownshipLateralResPath);
    UpdateOwnshipVerticalResPath();
    ShowFlight(ownshipVerticalResPath);
    render();
})