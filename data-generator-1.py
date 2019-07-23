# Libraries import
import sys
from sklearn.utils import shuffle
from math import degrees, cos, acos
import pandas as pd
import numpy as np
import random
import warnings
import json
from copy import deepcopy
from pprint import pprint

pd.set_option('display.max_rows', 10)
pd.set_option('display.max_columns', 100)
pd.set_option('display.width', 1000)
warnings.filterwarnings("error")
sys.path.insert(0, '/Volumes/DATA/tranngocphu@github.com/conflict-resolution-interface/python-code/python_lib')
from function_lib import RandomizeFlight, LateralConflictDetector, SurroundingFlight, WriteData

# Vars and Funcs declaration

# the following vars must be consistent with js code
sectorRadius = 320  # in drawing point unit
# Radius of the circular sector is 50 NM, equivelant to sectorRadius in drawing screen point
nm2point = sectorRadius / 50
nm2feet = 6076.12
feet2nm = 1 / nm2feet
feet2point = feet2nm * nm2point
margin = 10
paperWidth = 1900
paperHeight = 660
sectorCenter = np.array([sectorRadius + margin, paperHeight / 2])
cpa_threshold = 5 * nm2point
speed = 450 * nm2point / 3600
maxTimeShift = int(np.round(2 * sectorRadius / speed / 3))
minLength = sectorRadius * 1.2


# Actual generation of data

def GenerateAScenario():
    # ============================================
    # Number of flights in sector & flight indeces
    flightNum = 9  # should be multiplication of 3
    lowerIdx = np.arange(int(flightNum / 3))
    middleIdx = lowerIdx + int(flightNum / 3)
    upperIdx = middleIdx + int(flightNum / 3)

    # =============================================
    # Flight levels
    lowerLevel = random.sample(range(0, 14), 3)  # excluding right end
    middleLevel = random.sample(range(14, 24), 3)  # excluding right end
    upperLevel = random.sample(range(24, 38), 3)  # excluding right end

    # the below three lines force all levels to be THE SAME (not considering vertical dimension)
    # lowerLevel = [0, 0, 0]
    # middleLevel = [0, 0, 0] 
    # upperLevel = [0, 0, 0] 

    flightLevel = lowerLevel + middleLevel + upperLevel

    # =============================================
    # Flight Entry Time
    lowerEntryTime = random.sample(range(0, maxTimeShift), 3)
    middleEntryTime = random.sample(range(0, maxTimeShift), 3)
    upperEntryTime = random.sample(range(0, maxTimeShift), 3)
    middleEntryTime[1] = maxTimeShift
    flightEntryTime = lowerEntryTime + middleEntryTime + upperEntryTime

    # =============================================
    # Generation of flight paths
    allFlight = [None] * flightNum

    # Generate all flight, no conflict in each layer
    layerIdx = [lowerIdx, middleIdx, upperIdx]
    for currentLayerIdx in layerIdx:
        #        print('Layer:', currentLayerIdx)
        allFlight[currentLayerIdx[0]] = RandomizeFlight(sectorCenter, sectorRadius, minLength, flightEntryTime[currentLayerIdx[0]], maxTimeShift, speed, flightLevel[currentLayerIdx[0]], feet2point)
        for i in currentLayerIdx[1:]:
            checkAgainst = np.arange(currentLayerIdx[0], i)
            loop = 0
            while True:
                # print('Generating %sth flight. Loop %s' % (i, loop))
                continue_while = False
                allFlight[i] = RandomizeFlight(sectorCenter, sectorRadius, minLength, flightEntryTime[i], maxTimeShift, speed, flightLevel[i], feet2point)
                for j in checkAgainst:
                    try:
                        conflict = LateralConflictDetector(allFlight[i], allFlight[j], cpa_threshold)
                    except RuntimeWarning:
                        continue_while = True
                        break
                    if conflict[0]:
                        continue_while = True
                        break
                if continue_while:
                    loop += 1
                    continue
                break

    # Add conflict to middle layer
    ownshipIdxInMiddle = 1  # for numFlight = 9 particularly
    middleIntruderIdx = np.delete(middleIdx, ownshipIdxInMiddle)
    ownshipIdx = middleIdx[ownshipIdxInMiddle]
    stop = False
    loop = 0
    while True:
        # print('Generate onwship:', loop)
        allFlight[ownshipIdx] = RandomizeFlight(sectorCenter, sectorRadius, minLength, flightEntryTime[ownshipIdx], maxTimeShift, speed, flightLevel[ownshipIdx], feet2point)
        for intruderIdx in middleIntruderIdx:
            # print(intruderIdx)
            try:
                conflict = LateralConflictDetector(allFlight[ownshipIdx], allFlight[intruderIdx], cpa_threshold)
                print(conflict)
            except RuntimeWarning:
                stop = True
                break
            if conflict[0]:
                stop = True
                break
        if stop:
            break
        loop += 1

    ownship = allFlight[ownshipIdx]
    intruder = allFlight[intruderIdx]
    # conflict_pair = [ownship, intruder]

    surrounding_flight = [None] * ((len(allFlight)) - 2)
    idx = 0
    for i in range(0, len(allFlight)):
        if i == ownshipIdx or i == intruderIdx:
            continue
        surrounding_flight[idx] = SurroundingFlight(allFlight[i])  # convert to FLIGHT object for JSON serialization
        idx += 1

    # convert to list of JSON list, then join list to one JSON string
    surrounding_flight = [json.dumps(flight.__dict__) for flight in surrounding_flight]
    surrounding_flight = '[%s]' % ','.join(surrounding_flight)

    return ownship, intruder, surrounding_flight


# ============================
# Generate data frame
html_path = '/Volumes/DATA/tranngocphu@github.com/conflict-resolution-interface/cdr-interface/'
output_path = '/Volumes/DATA/tranngocphu@github.com/conflict-resolution-interface/cdr-interface/data/'
N = 20
demos = ['1']
for count in demos:
    df = pd.DataFrame()
    for i in range(0, N):
        print('%s: %s' % (count, i))
        ownship, intruder, surrounding_flight = GenerateAScenario()
        WriteData(i, df, ownship, intruder, surrounding_flight)
    df.to_csv( output_path + 'dataset_' + count + '_scenario.csv', index=False)
    df.to_json(output_path + 'dataset_' + count + '_scenario.json', orient='records')

# create demo.js from json string
jsonf = open(output_path + 'dataset_' + count + '_scenario.json', 'r')
json_content = jsonf.readline()
jsonf.close()

jsf = open(html_path + 'js/2.5d/demo.js', 'w+')
jsf.write('let demoData = ' + json_content + ';')
jsf.close()