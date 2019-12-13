# Funtions list:
#   1) full_conflict_detector(ownship, intruder)
#   2) deviation_score(ownship)
#   3) turning_angle_score(ownship)
# Inputs:
#   1) ownship: the flight being modified
#   2) intruder: the flight being left unchanged
# Inputs type: ownship and intruder are flightOb object. See flightOb class definition

import numpy as np
import pandas as pd
import math
import random
from copy import deepcopy

class SectorPoint:
    def __init__(self, coordType, firstCoord, secondCoord, sectorCenter):
        self.sectorCenter = sectorCenter
        if coordType == 'xy':
            # construtor for point defined by X, Y
            self.x = firstCoord
            self.y = secondCoord
            self.point = np.array([firstCoord, secondCoord])
            self.radius = np.NAN
            self.angle = np.NAN
            self.cartesian2polar()
        if coordType == 'polar':
            # construtor for point defined by Radius, Angle
            self.x = np.NAN
            self.y = np.NAN
            self.point = np.NAN
            self.radius = firstCoord
            self.angle = secondCoord
            self.polar2cartesian()
    def cartesian2polar(self):
        # Method to convert ABSOLUTE CATERSIAN COORDS to RELATIVE POLAR COORDS:
        self.radius = np.linalg.norm(self.point - self.sectorCenter)
        # Small x and y are relative coords
        x =   self.x - self.sectorCenter[0]
        y = - self.y + self.sectorCenter[1]
        angle = math.atan2(y, x) * 180 / np.pi
        if angle < 0 :
            angle += 360
        self.angle = angle
    def polar2cartesian(self):
        # Method to convert RELATIVE POLAR COORDS to ABSOLUTE CATERSIAN COORDS:
        if self.angle > 180 :
            angle = (self.angle - 360) * np.pi / 180
        else :
            angle = self.angle * np.pi / 180
        # Absolute coords:
        self.x =   self.radius * np.cos(angle) + self.sectorCenter[0]
        self.y = - self.radius * np.sin(angle) + self.sectorCenter[1]
        self.point = np.array([self.x, self.y])
    def __repr__(self):
        return 'SectorPoint(x:%s, y:%s, radius:%s, angle:%s)' % (self.x, self.y, self.radius, self.angle)

class flightOb:
    def __init__(self, Flight):
        self.entry_x = Flight[0]
        self.entry_y = Flight[1]
        self.exit_x = Flight[2]
        self.exit_y = Flight[3]
        self.middle_x = Flight[4]
        self.middle_y = Flight[5]
        self.entry_time = Flight[6]
        self.speed = Flight[7]
        self.entry  = np.array([self.entry_x, self.entry_y])
        self.exit   = np.array([self.exit_x, self.exit_y])
        self.middle = np.array([self.middle_x, self.middle_y])
        self.straight_length = np.linalg.norm(self.entry - self.exit)
        self.first_segment = np.linalg.norm(self.entry - self.middle)
        self.second_segment = np.linalg.norm(self.middle - self.exit)
        self.first_dir = (self.middle - self.entry) / self.first_segment
        self.second_dir = (self.exit - self.middle) / self.second_segment
        self.exit_time = self.entry_time + (self.first_segment + self.second_segment) / self.speed
        self.sync_time = None
        self.sync_offset = None
        self.sync_point = None
        self.sync_to_turn = None
        self.sync_point_x = None
        self.sync_point_y = None
        self.flight_level = None
        self.flight_point_level = None


class SurroundingFlight:
    def __init__(self, flight):
        self.entry_x = flight.entry_x
        self.entry_y = flight.entry_y
        self.exit_x = flight.exit_x
        self.exit_y = flight.exit_y
        self.middle_x = flight.middle_x
        self.middle_y = flight.middle_y
        self.entry_time = flight.entry_time
        self.flight_level = flight.flight_level
        self.speed = flight.speed
        self.sync_time = flight.sync_time
        self.sync_offset = flight.sync_offset
        self.sync_point_x = flight.sync_point_x
        self.sync_point_y = flight.sync_point_y
        self.flight_level = flight.flight_level
        self.flight_point_level = flight.flight_point_level


def RandomizeFlight(sectorCenter, sectorRadius, minLength, entryTime, maxTimeShift, speed, flightLevel, feet2point):
    entry = SectorPoint('polar', sectorRadius, random.randrange(0,360), sectorCenter)
    exitt = SectorPoint('polar', sectorRadius, random.randrange(0,360), sectorCenter)
    while np.linalg.norm(entry.point - exitt.point) < minLength:
        exitt = SectorPoint('polar', sectorRadius, random.randrange(0,360), sectorCenter)
    middle = SectorPoint('xy', (entry.x + exitt.x) / 2, (entry.y + exitt.y) / 2, sectorCenter)
    flight_data = np.array([entry.x, entry.y, exitt.x, exitt.y, middle.x, middle.y, entryTime, speed])
    flight = flightOb(flight_data)
    flight.sync_time = maxTimeShift - entryTime
    flight.sync_offset = flight.speed * flight.sync_time
    flight.sync_point = flight.entry + flight.first_dir * flight.sync_offset
    flight.sync_point_x = flight.sync_point[0]
    flight.sync_point_y = flight.sync_point[1]
    flight.flight_level = flightLevel
    flight.flight_point_level = flightLevel * 100 * feet2point
    flight.sync_to_turn = np.linalg.norm(flight.sync_point - flight.middle)
    return flight


# Function to detect cpa of 2 segments of flight's path
# Input: x and y coordinates of begin and end points of 2 flight segments
#        and speed of each flight
def cpa_calculator(start1, end1, dir1, speed1, start2, end2, dir2, speed2, cpaThreshold):
    # segments length
    d1 = np.linalg.norm(end1 - start1)
    d2 = np.linalg.norm(end2 - start2)
    # initial closure vector and relative velocity vector
    w0 = start1 - start2
    dv = dir1 * speed1 - dir2 * speed2
    time2cpa = - (np.dot(w0, dv)) / (np.linalg.norm(dv) * np.linalg.norm(dv))
    travelledDist1 = speed1 * time2cpa
    travelledDist2 = speed2 * time2cpa
    cpaPoint1 = start1 + dir1 * travelledDist1
    cpaPoint2 = start2 + dir2 * travelledDist2
    cpaClosure = np.linalg.norm(cpaPoint1 - cpaPoint2)
    if time2cpa >= 0:
        if travelledDist1 <= d1 and travelledDist2 <= d2 and cpaClosure < cpaThreshold:
            # There is CPA and LOS
            return [True, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 1]
        else:
            # There is CPA but NOT LOS
            if cpaClosure >= cpaThreshold and travelledDist1 <= d1 and travelledDist2 <= d2:
                return [False, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 2]
            dmin = min(d1, d2)
            stop1 = start1 + dir1 * dmin
            stop2 = start2 + dir2 * dmin
            cpaClosure = np.linalg.norm(stop1 - stop2)
            return [False, cpaClosure, time2cpa, stop1, stop2, 3]
    else:
        if np.linalg.norm(w0) < cpaThreshold:
            # There is NO CPA but inital LOS: initial closure drops below closure threshold
            return [True, np.linalg.norm(w0), time2cpa, start1, start2, 4]
        else:
            # There is NO CPA, initial closure satisfies closure threshold
            return [False, np.linalg.norm(w0), time2cpa, start1, start2, 5]


def full_conflict_detector(lateFlight, earlyFlight, cpaThreshold, complex_entry_time=False):
    allCpa = []
    ownship  = deepcopy(lateFlight)
    intruder = deepcopy(earlyFlight)
    if complex_entry_time:
        # Adjust entries of 2 flight if intruder.entry_time != 0
        intruder.entry = intruder.entry + intruder.first_dir * intruder.speed * intruder.entry_time
        ownship.entry_time = lateFlight.entry_time - earlyFlight.entry_time
        intruder.entry_time = 0
    # TIMING
    initial_offset_time = ownship.entry_time - intruder.entry_time
    intruder_initial_offset = intruder.speed * initial_offset_time
    # Checking ownship[0] vs intruder[0]
    if intruder_initial_offset < intruder.first_segment:
        intruder_start = intruder.entry + intruder.first_dir * intruder_initial_offset
        hasCpa = cpa_calculator(ownship.entry, ownship.middle, ownship.first_dir, ownship.speed,
                                intruder_start, intruder.middle, intruder.first_dir, intruder.speed,
                                cpaThreshold)
        if hasCpa[0]:
            hasCpa.append('ownship[0] vs intruder[0]')
            return hasCpa
        else:
            allCpa.append(hasCpa)
    # Checking ownship[0] vs intruder[1]
    if intruder_initial_offset < intruder.first_segment:
        intruder_start = intruder.middle
        offset_time = (intruder.first_segment - intruder_initial_offset) / intruder.speed
    else:
        intruder_start = intruder.middle + intruder.second_dir * (intruder_initial_offset - intruder.first_segment)
        offset_time = 0
    ownship_start_offset = offset_time * ownship.speed
    if ownship_start_offset < ownship.first_segment:
        ownship_start = ownship.entry + ownship.first_dir * ownship_start_offset
        hasCpa = cpa_calculator(ownship_start, ownship.middle, ownship.first_dir, ownship.speed,
                                intruder_start, intruder.exit, intruder.second_dir, intruder.speed,
                                cpaThreshold)
        if hasCpa[0]:
            hasCpa.append('ownship[0] vs intruder[1]')
            return hasCpa
        else:
            allCpa.append(hasCpa)
    # Checking ownship[1] vs intruder[0]
    if intruder_initial_offset < intruder.first_segment:
        ownship_reach_mid_time = ownship.first_segment / ownship.speed
        intruder_start_offset = intruder_initial_offset + intruder.speed * ownship_reach_mid_time
        if intruder_start_offset < intruder.first_segment:
            intruder_start = intruder.entry + intruder.first_dir * intruder_start_offset
            hasCpa = cpa_calculator(ownship.middle, ownship.exit, ownship.second_dir, ownship.speed,
                                    intruder_start, intruder.middle, intruder.first_dir, intruder.speed,
                                    cpaThreshold)
            if hasCpa[0]:
                hasCpa.append('ownship[1] vs intruder[0]')
                return hasCpa
            else:
                allCpa.append(hasCpa)
    # Checking ownship[1] vs intruder[1]
    jumpToEnd = False
    if intruder_initial_offset < intruder.first_segment:
        intruder_reach_mid_time = intruder.first_segment / intruder.speed
        ownship_reach_mid_time  = initial_offset_time + ownship.first_segment / ownship.speed
        reach_mid_time_diff = ownship_reach_mid_time - intruder_reach_mid_time
        if reach_mid_time_diff < 0: # ownship reaches mid point earlier
            ownship_start_offset = np.absolute(reach_mid_time_diff) * ownship.speed
            if ownship_start_offset < ownship.second_segment:
                ownship_start = ownship.middle + ownship.second_dir * ownship_start_offset
                intruder_start = intruder.middle
            else:
                jumpToEnd = True
        else: # intruder reaches mid point earlier
            intruder_start_offset = reach_mid_time_diff * intruder.speed
            if intruder_start_offset < intruder.second_segment:
                ownship_start = ownship.middle
                intruder_start = intruder.middle + intruder.second_dir * intruder_start_offset
            else:
                jumpToEnd = True
    else:
        ownship_entry2mid_time = ownship.first_segment / ownship.speed
        intruder_start_offset = (intruder_initial_offset - intruder.first_segment) + intruder.speed * ownship_entry2mid_time
        if intruder_start_offset < intruder.second_segment:
            ownship_start = ownship.middle
            intruder_start = intruder.middle + intruder.second_dir * intruder_start_offset
        else:
            jumpToEnd = True
    if jumpToEnd == False:
        hasCpa = cpa_calculator(ownship_start, ownship.exit, ownship.second_dir, ownship.speed,
                                intruder_start, intruder.exit, intruder.second_dir, intruder.speed,
                                cpaThreshold)
        if hasCpa[0]:
            hasCpa.append('ownship[1] vs intruder[1]')
            return hasCpa
        else:
            allCpa.append(hasCpa)
    freeConflictCpa = allCpa[0][1]
    freeConflictCpaIdx = 0
    for i in range(0, len(allCpa)):
        if allCpa[i][1] < freeConflictCpa:
            freeConflictCpa = allCpa[i][1]
            freeConflictCpaIdx = i
    return allCpa[freeConflictCpaIdx]

# =============================================================
# Function to calculate deviation score and turning angle score
# Input are entry, exit and middle points of modified path
# Each input parameter is object of SectorPoint class

def deviation_score(ownship):
    entry  = SectorPoint('xy', ownship.entry_x,  ownship.entry_y,  sectorCenter)
    middle = SectorPoint('xy', ownship.middle_x, ownship.middle_y, sectorCenter)
    exitt  = SectorPoint('xy', ownship.exit_x,   ownship.exit_y,   sectorCenter)
    originalLength = np.linalg.norm(entry.point - exitt.point)
    # construct mid point of original path
    midPoint = (entry.point + exitt.point) / 2
    # convert mid point of original path to polar coords
    midPoint = SectorPoint('xy', midPoint[0], midPoint[1], sectorCenter)
    worstMiddle = SectorPoint('polar', sectorRadius, midPoint.angle + 180, sectorCenter)
    worstLength = 2 * np.linalg.norm(worstMiddle.point - entry.point)
    resolutionLength = np.linalg.norm(entry.point - middle.point) + np.linalg.norm(exitt.point - middle.point)
    return (worstLength - resolutionLength) / (worstLength - originalLength) * 100

def turning_angle_score(ownship):
    entry  = SectorPoint('xy', ownship.entry_x,  ownship.entry_y,  sectorCenter)
    middle = SectorPoint('xy', ownship.middle_x, ownship.middle_y, sectorCenter)
    exitt  = SectorPoint('xy', ownship.exit_x,   ownship.exit_y,   sectorCenter)
    d0 = np.linalg.norm(entry.point - exitt.point)   # original length
    d1 = np.linalg.norm(entry.point - middle.point)  # first segment length
    d2 = np.linalg.norm(exitt.point - middle.point)  # second segment length
    entryTurn  = (180 / np.pi) * np.arccos((d0*d0 + d1*d1 - d2*d2) / (2*d0*d1))
    middleTurn = (180 / np.pi) * np.arccos((d1*d1 + d2*d2 - d0*d0) / (2*d1*d2))
    exitTurn   = (180 / np.pi) * np.arccos((d0*d0 + d2*d2 - d1*d1) / (2*d0*d2))
    entryScore  = (90 - entryTurn) / 90 * 100
    middleScore = middleTurn / 180 * 100
    exitScore   = (90 - exitTurn) / 90 * 100
    return (entryScore + middleScore + exitScore) / 3

def find_slope_intercept(x1, y1, x2, y2):
    slope = (y1 - y2) / (x1 - x2)
    intercept = y1 - slope * x1
    return slope, intercept



# ===================================================================================
# FUNCTION FOR 3D RESOLUTION
# ===================================================================================

# Function to detect CPA of 2 flight segments
# Inputs:
#     begin1, end1, begin2, end2: np.array([x, y, z])
#     speed1, speed2: a number

def SpaceCpaCalculator(begin1, end1, speed1, begin2, end2, speed2, cpaThreshold):
    d1 = np.linalg.norm(end1 - begin1)
    d2 = np.linalg.norm(end2 - begin2)
    v1 = (end1 - begin1) / d1
    v2 = (end2 - begin2) / d2
    w0 = begin1 - begin2
    initialClosure = np.linalg.norm(w0)
    if initialClosure < cpaThreshold:
        return [True, initialClosure, 0, begin1, begin2, 4]
    dv = v1 * speed1 - v2 * speed2
    time2cpa = - np.dot(w0, dv) /  (np.linalg.norm(dv)**2)
    if time2cpa > 0:
        travelledDist1 = speed1 * time2cpa
        travelledDist2 = speed2 * time2cpa
        cpaPoint1 = begin1 + travelledDist1 * v1
        cpaPoint2 = begin2 + travelledDist2 * v2
        cpaClosure = np.linalg.norm(cpaPoint1 - cpaPoint2)
        if cpaClosure < cpaThreshold and travelledDist1 <= d1 and travelledDist2 <= d2:
            return [True, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 1]
        else:
           if cpaClosure >= cpaThreshold and travelledDist1 <= d1 and travelledDist2 <= d2:
               return [False, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 2]
           else:
               dmin = min(d1, d2)
               cpaPoint1 = begin1 + dmin * v1
               cpaPoint2 = begin2 + dmin * v2
               cpaClosure = np.linalg.norm(cpaPoint1 - cpaPoint2)
               return [False, cpaClosure, time2cpa, cpaPoint1, cpaPoint2, 3]
    else:
        initialClosure = np.linalg.norm(w0)
        if initialClosure < cpaThreshold:
            return [True, initialClosure, time2cpa, begin1, begin2, 4]
        else:
            return [False, initialClosure, time2cpa, begin1, begin2, 5]


# Function to detect CPA of OWNSHIP and intruder
# Inputs: ownship and intruder are flightOb objects
# This function should NOT be used for non-ownship flight
def LateralConflictDetector(ownship, intruder, cpaThreshold):
    cpaResult = []
    # ownship
    ownshipLevel = ownship.flight_point_level
    ownshipSpeed = ownship.speed
    begin1  = np.array([ownship.entry_x, ownship.entry_y, ownshipLevel])
    end1    = np.array([ownship.middle_x, ownship.middle_y, ownshipLevel])
    # intruder
    intruderLevel = intruder.flight_point_level
    intruderSpeed = intruder.speed
    begin2 = np.array([intruder.sync_point_x, intruder.sync_point_y, intruderLevel])
    end2   = np.array([intruder.exit_x,  intruder.exit_y,  intruderLevel])
    # check conflict
    conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed, cpaThreshold)
    if conflict[0]:
        return conflict
    else:
        ownshipTime2Turn = ownship.first_segment / ownshipSpeed
        intruderOffset = ownshipTime2Turn * intruderSpeed
        if intruderOffset > intruder.straight_length:
            return conflict
        else:
            cpaResult.append(conflict)
            begin1 = end1
            end1 = np.array([ownship.exit_x, ownship.exit_y, ownshipLevel])
            begin2 = intruder.sync_point + intruderOffset * intruder.first_dir  # 2D only
            begin2 = np.array([begin2[0], begin2[1], intruderLevel])  # becomes 3D
            conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed, cpaThreshold)
            conflict[2] = conflict[2] + ownshipTime2Turn  # adjust time2cpa to include ownshipTime2Turn
            if conflict[0]:
                return conflict
            else:
                cpaResult.append(conflict)
                idx = 0
                if cpaResult[1][1] < cpaResult[0][1]:
                    idx = 1
                return cpaResult[idx]


# Function to detect CPA between non-ownship flights
# This is for GENERATION OF DATA ONLY
# DO NOT USED THIS FOR DETECTION DURING RUNTIME
def SurroundingLateralConflictDetector(flight1, flight2, cpaThreshold, type=''):
    cpaResult = []
    # ownship
    ownshipLevel = flight1.flight_point_level
    ownshipSpeed = flight1.speed
    begin1  = np.array([flight1.sync_point_x, flight1.sync_point_y, ownshipLevel])
    end1    = np.array([flight1.exit_x, flight1.exit_y, ownshipLevel])

    # intruder
    intruderLevel = flight2.flight_point_level
    intruderSpeed = flight2.speed
    begin2 = np.array([flight2.sync_point_x, flight2.sync_point_y, intruderLevel])
    end2   = np.array([flight2.exit_x, flight2.exit_y, intruderLevel])

    if type == 'surrounding':
        end1 = np.array([flight1.exit_x, flight1.exit_y])
        end1 = end1 + flight1.first_dir * 0.3 * flight1.straight_length
        end1 = np.array([end1[0], end1[1], ownshipLevel])
        end2 = np.array([flight2.exit_x, flight2.exit_y])
        end2 = end2 + flight2.first_dir * 0.3 * flight2.straight_length
        end2 = np.array([end2[0], end2[1], intruderLevel])
    
    # check conflict
    conflict = SpaceCpaCalculator(begin1, end1, ownshipSpeed, begin2, end2, intruderSpeed, cpaThreshold)
    return conflict


# ===================================================================================
# DATA STRUCTURE PREPARATION
# ===================================================================================

all_cols =  ['scenario_id',
             'scenario_type',
             'num_of_flight',
             'entry_x_0',
             'entry_y_0',
             'entry_angle_0',
             'exit_x_0',
             'exit_y_0',
             'exit_angle_0',
             'middle_x_0',
             'middle_y_0',
             'middle_radius_0',
             'middle_angle_0',
             'speed_0',
             'entry_time_0',
             'exit_time_0',
             'entry_x_1',
             'entry_y_1',
             'entry_angle_1',
             'exit_x_1',
             'exit_y_1',
             'exit_angle_1',
             'middle_x_1',
             'middle_y_1',
             'middle_radius_1',
             'middle_angle_1',
             'speed_1',
             'entry_time_1',
             'exit_time_1',
             'shift_time',
             'entry_closure',
             'is_conflict',
             'conflict_angle',
             'cpa_location_x',
             'cpa_location_y',
             'cpa_location_radius',
             'cpa_location_angle',
             'category',
             'modify_0',
             'modify_1',
             'added_point_x',
             'added_point_y',
             'added_point_radius',
             'added_point_angle',
             'deviation_ratio',
             'entry_turning_angle',
             'middle_turning_angle',
             'exit_turning_angle',
             'conflict_cleared',
             'score',
             'timestamp',
             'upper_flight',
             'middle_flight',
             'lower_flight',
             'sync_time_0',
             'sync_time_1',
             'sync_point_x_0',
             'sync_point_y_0',
             'sync_point_x_1',
             'sync_point_y_1']

intruder_cols = ['entry_x_0', 'entry_y_0', 'exit_x_0', 'exit_y_0', 'middle_x_0', 'middle_y_0', 'entry_time_0', 'speed_0']
ownship_cols  = ['entry_x_1', 'entry_y_1', 'exit_x_1', 'exit_y_1', 'middle_x_1', 'middle_y_1', 'entry_time_1', 'speed_1']
srd_cols = ['entry_x', 'entry_y', 'exit_x', 'exit_y', 'middle_x', 'middle_y', 'entry_time', 'speed']

def WriteData(i, df, ownship, intruder, surrounding_flight):
    # Write to dataframe
    df.loc[i, 'scenario_id']     = i + 1
    df.loc[i, 'scenario_type']   = None
    df.loc[i, 'num_of_flight']   = 2
    df.loc[i, 'entry_x_0']       = intruder.entry_x
    df.loc[i, 'entry_y_0']       = intruder.entry_y
    df.loc[i, 'entry_angle_0']   = None
    df.loc[i, 'exit_x_0']        = intruder.exit_x
    df.loc[i, 'exit_y_0']        = intruder.exit_y
    df.loc[i, 'exit_angle_0']    = None
    df.loc[i, 'middle_x_0']      = intruder.middle_x
    df.loc[i, 'middle_y_0']      = intruder.middle_y
    df.loc[i, 'middle_radius_0'] = None
    df.loc[i, 'middle_angle_0']  = None
    df.loc[i, 'speed_0']         = intruder.speed
    df.loc[i, 'entry_time_0']    = intruder.entry_time
    df.loc[i, 'entry_x_1']       = ownship.entry_x
    df.loc[i, 'entry_y_1']       = ownship.entry_y
    df.loc[i, 'entry_angle_1']   = None
    df.loc[i, 'exit_x_1']        = ownship.exit_x
    df.loc[i, 'exit_y_1']        = ownship.exit_y
    df.loc[i, 'exit_angle_1']    = None
    df.loc[i, 'middle_x_1']      = ownship.middle_x
    df.loc[i, 'middle_y_1']      = ownship.middle_y
    df.loc[i, 'middle_radius_1'] = None
    df.loc[i, 'middle_angle_1']  = None
    df.loc[i, 'speed_1']         = ownship.speed
    df.loc[i, 'entry_time_1']    = ownship.entry_time
    df.loc[i, 'is_conflict']     = None
    df.loc[i, 'ownship_level']   = ownship.flight_level
    df.loc[i, 'intruder_level']  = intruder.flight_level
#    df.loc[i, 'upper_level_flight']  = upper_flight
#    df.loc[i, 'middle_level_flight'] = middle_flight
#    df.loc[i, 'lower_level_flight']  = lower_flight
    df.loc[i, 'surrounding_flight']  = surrounding_flight
    df.loc[i, 'sync_time_0']   = intruder.sync_time
    df.loc[i, 'sync_time_1']   = ownship.sync_time
    df.loc[i, 'sync_point_x_0']  = intruder.sync_point_x
    df.loc[i, 'sync_point_y_0']  = intruder.sync_point_y
    df.loc[i, 'sync_point_x_1']  = ownship.sync_point_x
    df.loc[i, 'sync_point_y_1']  = ownship.sync_point_y
    df['scenario_id']   = df['scenario_id'].astype(int)
    df['num_of_flight'] = df['num_of_flight'].astype(int)
    