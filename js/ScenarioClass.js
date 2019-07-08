// This file contains definition of CONFLICT PAIR CLASS.
// Each instance of this class represents a conflict in the sector.
// The properties Flights contains id of 2 flights that being involved in the current conflict.
// These 2 flights id are idexes of flights in the Sector.FLights array
// Phu Tran, 19 June 2018

class SCENARIO {
    constructor (id, n, m, sector) {
        this.ScenarioId = id;
        this.OriginalFlight = [];
        this.ModifiedFlight = [];
        this.FlightNum = n;
        this.NumOfPair = m;
        this.OriginalPair = new Array(m);
        this.ModifiedPair = new Array(m);
        this.ConflictNum = null;
        this.Sector = sector;
        for (var i=0; i<n; i++) {
            this.ModifiedFlight[i] = { IsModified: false, AddedPoint: { x: null, y: null, radius: null, angle: null } };
        }
    }

}

class ORIGINALPAIR {
    constructor() {
        this.HasConflict = false;
        this.Pair = { early: null, late: null };
        this.Conflict = new CONFLICT();
    }
}

class CONFLICT {
    constructor() {
        this.EntryClosure      = null;
        // this.Time2LOS       = new Array(2);
        this.LOSLocation       = { x: null, y: null, radius: null, angle: null };
        this.ShiftTime         = null;
        this.ShiftDistance     = null;
        this.ConflictAngle     = null;
    }
}

class MODIFIEDPAIR {
    constructor() {
        this.ModifiedFlightIdx = 0;
        this.ConflictAwareness = null;
        this.HasCPA            = null;
        this.Pair              = null;
        this.Deviation         = new RESOLUTIONFACTOR ();
        // this.CPALocationShift  = new RESOLUTIONFACTOR ('CPALocationShift');
        // this.CpaClosure        = new RESOLUTIONFACTOR ('CpaClosure');
        this.TurningAngle      = new RESOLUTIONFACTOR ();
        // this.DecisionTime      = new RESOLUTIONFACTOR ('DecisionTime');
        this.Category          = null;
        // this.RecentScoreShown  = null;
        // this.LiveCPALineShown  = null;
        this.TotalScore        = null;
        this.CalculateTotalScore();
    }
    CalculateTotalScore() {
        // Set weight:
        this.Deviation.SetWeight(0.5);
        // this.CPALocationShift.SetWeight(0);
        // this.Time2Cpa.SetWeight(0);
        // this.CpaClosure.SetWeight(0);
        this.TurningAngle.SetWeight(0.5);
        // this.DecisionTime.SetWeight(0);        
        this.TotalScore  = this.Deviation.Score * this.Deviation.Weight;
        this.TotalScore += this.TurningAngle.Score * this.TurningAngle.Weight;
        // this.TotalScore += this.CPALocationShift.Score * this.CPALocationShift.Weight;
        // this.TotalScore += this.CpaClosure.Score * this.CpaClosure.Weight;
        // this.TotalScore += this.DecisionTime.Score * this.DecisionTime.Weight;
    }
}

class RESOLUTIONFACTOR {
    constructor() {
        this.Value  = null;
        this.Score  = null;
        this.Weight = null;        
    }
    SetValue(value) {
        this.Value = value;
    }
    SetWeight(weight) {
        this.Weight = weight;
    }
    SetScore(score) {
        this.Score = score;
    }
}

function CalculateScore(ownshipIdx, intruderIdx) {
    var output = { Deviation: null, TurningAngle: null };
    // DEVIATION
    var entry = oriPath[ownshipIdx].Path.firstSegment.point;
    var exit  = oriPath[ownshipIdx].Path.lastSegment.point;
    var mid   = oriPath[ownshipIdx].Path.bounds.center;
    var path  = new Path.Line({ segments: [mid, view.center] });
    path.fitBounds(vs.SectorBorder.bounds);
    var cuts = path.getIntersections(vs.SectorBorder);
    var worstPoint = cuts[0].point;
    if (cuts[1].point.getDistance(mid) > worstPoint.getDistance(mid)) {
        worstPoint = cuts[1].point;
    }
    var worstDistance = entry.getDistance(worstPoint) + worstPoint.getDistance(exit);
    // var oriDistance = oriPath[ownshipIdx].Path.length;
    var oriDistance = oriPath[ownshipIdx].Path.firstSegment.point.getDistance(oriPath[ownshipIdx].Path.lastSegment.point);
    var currentDistance = modPath[ownshipIdx].Path.length;
    var deviation = currentDistance / oriDistance;
    var score = math.round((worstDistance - currentDistance) / (worstDistance - oriDistance) * 100);
    output.Deviation = { value: deviation, score: math.round(score) } ;
    // end of deviation 
    
    // TURNING ANGLE  
    
    var firstNewSegment  = modPath[ownshipIdx].Path.firstCurve.length;
    var secondNewSegment = modPath[ownshipIdx].Path.lastCurve.length;
    // console.log(firstNewSegment, secondNewSegment);
    var firstTurn  = (180 / pi) * math.acos((oriDistance * oriDistance + firstNewSegment * firstNewSegment - secondNewSegment * secondNewSegment) / (2 * oriDistance * firstNewSegment));
    var secondTurn = (180 / pi) * math.acos((firstNewSegment * firstNewSegment + secondNewSegment * secondNewSegment - oriDistance * oriDistance) / (2 * firstNewSegment * secondNewSegment));
    var thirdTurn  = (180 / pi) * math.acos((secondNewSegment * secondNewSegment + oriDistance * oriDistance - firstNewSegment * firstNewSegment) / (2 * secondNewSegment * oriDistance));
    // console.log(2 * oriDistance * firstNewSegment);
    // console.log('Three turns: ', firstTurn, secondTurn, thirdTurn);
    score =  math.round( (90 - firstTurn) / 90 * 100 ); 
    score += math.round( secondTurn  / 180 * 100 );
    score += math.round( (90 - thirdTurn) / 90 * 100 ); 
    output.TurningAngle = { value: [firstTurn, secondTurn, thirdTurn], score: score / 3 };
    // end of turning angle
    // console.log('Current Score:', output);
    return output
}