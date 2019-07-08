// This file contains definition of VISUAL SETTING CLASS.
// There will be only one instance of this class when the app is running
// For modification of various visual setting, please change in the Constructor of this class
// Phu Tran, 17 June 2018

class VISUALTOOL {
    constructor () {
        this.Color = {red: 'red', blue: 'blue', black: 'black', green: 'green', gray: new Color(0.5)};
        this.FlightStroke = 5;
        this.ThinnerStroke = 0.5;
        this.ThinStroke = 1;
        this.ThickStroke = 3;
        this.ThickerStroke = 8;
        this.DashLineStyle = [5,3];
        this.ViewSize = 750; // Size of drawing space
        this.GridStep = this.ViewSize / 20;
        this.PointMarkerSize = 5;
        this.AircraftSize = 8;
        // Create 5 layers for differernt types of objects
        this.GridLayer = new paper.Layer({ id: 0, name: 'gridLayer' });
        this.ObjLayer  = new paper.Layer({ id: 1, name: 'objLayer'  });
        // this.AdjLayer  = new paper.Layer({ id: 2, name: 'adjLayer'  });
        // this.TxtLayer  = new paper.Layer({ id: 3, name: 'txtLayer'  });
        this.AniLayer  = new paper.Layer({ id: 4, name: 'aniLayer'  });
        this.IndLayer  = new paper.Layer({ id: 5, name: 'indLayer'  });
        this.TopLayer  = new paper.Layer({ id: 6, name: 'topLayer'  });
        // this.TmpLayer  = new paper.Layer({ id: 6, name: 'TmpLayer'  }); 
        // center of sector
        this.Origin = null; // to be assigned to view.center        
    }
    PointMarker (point, size, color, visibility) {
        return new Path.Circle({
            center: point,
            radius: size,
            fillColor: color,
            visible: visibility
        })
    }
    EntryMarker (point, size, color, visibility) {
        return new Path.Circle({
            center: point,
            radius: size,
            strokeWidth: 4,
            strokeColor: color,
            visible: visibility
        })
    }
    //=========================================
    // Scaling Functions: Physcial vs Map Units
    //=========================================
    Real2Map(num) {
        if (num.constructor === Array) { return num.map(function (x) { return x * this.MapScale; }); } 
        else { return num * mySector.MapScale;}
    };
    Map2Real(num) {
        if (num.constructor === Array) { return num.map(function (x) { return x / this.MapScale; }); } 
        else { return num / mySector.MapScale; }
    }
    StopAnimation() {
        view.pause();
        aircraft.map(function(element) {
            element.position = hidden;
            return element
        })
    }
}