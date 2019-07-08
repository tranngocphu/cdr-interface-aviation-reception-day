// ====================================
// Definition of SECTOR CLASS
// ====================================
class SECTOR {
    constructor () {
        this.SectorSize    = 50;
        this.AircraftSpeed = 450;
        this.MapScale      = null;
        this.Origin        = null;
        this.MinCPA        = 5;
        this.Center        = null;
    }    
} 
// end of definition


// ==================================
// Plot coordinates grid functions
// ==================================
function ViewSector() {
    vs.GridLayer.activate();
    // Two major axes
    hLine(view.center.x - vs.Real2Map(mySector.SectorSize) , view.center.x + vs.Real2Map(mySector.SectorSize), view.center.y, new Color(0.8), vs.ThickStroke);
    vLine(view.center.x, view.center.y - vs.Real2Map(mySector.SectorSize), view.center.y + vs.Real2Map(mySector.SectorSize), new Color(0.8), vs.ThickStroke);
    // this.plot_linear_grid(vs.ViewSize, vs.GridStep, vs.ThinnerStroke);
    plot_circular_grid(vs.Origin, vs.GridStep, vs.ThinnerStroke);
    plot_polar_grid(vs.ThinnerStroke);
    sector_border(vs.ViewSize, vs.Origin, vs.ThickStroke);
}

function hLine(x1, x2, y, color, strokeWidth) {
    return new Path.Line({
        from: [x1, y],
        to: [x2, y],
        strokeColor: color,
        strokeWidth: strokeWidth
    });
}

function vLine(x, y1, y2, color, strokeWidth) {
    return new Path.Line({
        from: [x, y1],
        to: [x, y2],
        strokeColor: color,
        strokeWidth: strokeWidth
    });
}

function plot_linear_grid(viewSize, gridStep, strokeWidth) {
    for (var i = 1; i < 10; i++) {
        hLine(viewSize / 2 + i * gridStep, viewSize, new Color(0.8), strokeWidth);
        hLine(viewSize / 2 - i * gridStep, viewSize, new Color(0.8), strokeWidth);
        vLine(viewSize / 2 + i * gridStep, viewSize, new Color(0.8), strokeWidth);
        vLine(viewSize / 2 - i * gridStep, viewSize, new Color(0.8), strokeWidth);
    }
}

function plot_circular_grid(center, gridStep, strokeWidth) {
    for (var i = 1; i < 10; i++) {
        new Path.Circle({
            center: center,
            radius: i * gridStep,
            strokeColor: new Color(0.8),
            strokeWidth: strokeWidth
        })
    }
}

function plot_polar_grid(strokeWidth) {
    for (var i = 1; i < 18; i++) {
        var path = hLine(view.center.x - vs.Real2Map(mySector.SectorSize) , view.center.x + vs.Real2Map(mySector.SectorSize), view.center.y, new Color(0.8), strokeWidth);
        path.rotate(i * 10);
    }
}

function sector_border(viewSize, center, strokeWidth) {
    vs.SectorBorder = new Path.Circle({
        center: center,
        radius: viewSize/2,
        strokeWidth: strokeWidth,
        strokeColor: new Color(0.8)
    })
}
// end of functions