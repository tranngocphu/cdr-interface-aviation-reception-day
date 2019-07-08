// This file contains definition of FLIGHT CLASS.
// Each instance of this class represents a flight in the sector (of all the time)
// Instances of this class is stored as members of the FLights array, which is a property of SECTOR CLASS
// Each instance contains Original Path and Modified Path, together with their event handlers. See below.
// Phu Tran, 19 June 2018

class FLIGHT {
    constructor(width, color, idx, type) {
        this.Idx = idx;
        this.PairInvolved = null;
        this.EntryTime = 10000;
        this.ExitTime = null;
        this.EntryAngle = null;
        this.ExitAngle = null;
        this.LosApproach = null;
        this.Distance2LosCircle = null;
        this.Color = color;
        this.Path  = new Path.Line({
            segments: [],
            strokeWidth: width,
            strokeColor: color
        });
        this.Path.Idx = this.Idx; 
        
        if (type == 'mod') {
            this.Path.dashArray = vs.DashLineStyle;
            this.Path.visible   = false;
        }
        this.Path.onMouseDown = function (event) {
            if (!allowPathChange) {
                return
            }
            if (this.Idx == 0) {
                return
            }
            if (mouseDisabled[this.Idx] == true) {
                return
            }           
            selectedIdx = this.Idx;
            if (trigger) {
                SendHardTrigger(StartDragging);
            }
            modPath[this.Idx].Path.visible = true; // view modified path of THIS FLIGHT                                
        }
        this.Path.onMouseEnter = function () {
            if (!allowPathChange) {
                return
            }
            if (mouseDisabled[this.Idx] == true) {
                return
            }
            this.strokeWidth = vs.ThickerStroke;         
        }
        this.Path.onMouseLeave = function () {
            if (!allowPathChange) {
                return
            }
            this.strokeWidth = vs.FlightStroke;
        } 
    }
}   