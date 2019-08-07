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
import matplotlib.pyplot as plt
from itertools import product
from copy import deepcopy

pd.set_option('display.max_rows', 10)
pd.set_option('display.max_columns', 100)
pd.set_option('display.width', 1000)

warnings.filterwarnings("error")
sys.path.insert(0, '/Volumes/DATA/tranngocphu@github.com/conflict-resolution-interface/python-code/python_lib')
from function_lib import *

# Vars and Funcs declaration

# the following vars must be consistent with js code
sectorRadius = 330  # in drawing point unit
# Radius of the circular sector is 50 NM, equivelant to sectorRadius in drawing screen point
nm2point = sectorRadius / 50
nm2feet = 6076.12
feet2nm = 1 / nm2feet
feet2point = feet2nm * nm2point
margin = 0
paperWidth = 660
paperHeight = 660
sectorCenter = np.array([sectorRadius + margin, paperHeight / 2])
cpa_threshold = 5 * nm2point
speed = 450 * nm2point / 3600
maxTimeShift = int(np.round(2 * sectorRadius / speed / 3))
minLength = sectorRadius * 1.2
minTime2Cpa = 360
maxLoopAllowed = 5000



# Actual generation of data
def GenerateScenarioSingleLayer(flightNum):
    ownshipIdx = 1
    flightLevel = [0] * flightNum
    flightEntryTime = random.sample(range(0, maxTimeShift), flightNum)
    flightEntryTime[ownshipIdx] = maxTimeShift
    allFlight = []
    
    # generating all surrounding flights with no conflict
    for i in range(0, flightNum):
        loop = 0
        while True:
            newFlight = RandomizeFlight(sectorCenter, sectorRadius, minLength, flightEntryTime[i], maxTimeShift, speed, flightLevel[i], feet2point)
            try:
                conflicts = [ SurroundingLateralConflictDetector(newFlight, existingFlight, cpa_threshold, 'surrounding')[0] for existingFlight in allFlight ] 
                print('Generating %sth Surrounding Aircraft:' % i, conflicts)       
            except RuntimeWarning:
                loop += 1
                continue
            if any(conflicts):
                loop += 1
                continue            
            allFlight.append(newFlight)
            break
        
    
    test_mask = [True] + [False] * (flightNum - 2)
    loop = 0
    againstFlight = [ allFlight[i] for i in range(0, flightNum) if i != 1 ]  # this is allFlight except position of ownship
    
    while True:
        if loop == maxLoopAllowed:
            return False, False, False, False
        ownship = RandomizeFlight(sectorCenter, sectorRadius, minLength, flightEntryTime[ownshipIdx], maxTimeShift, speed, flightLevel[ownshipIdx], feet2point)
        try:
            conflicts = [ SurroundingLateralConflictDetector(ownship, existingFlight, cpa_threshold) for existingFlight in againstFlight ]  
            conflict_bool = [ conflict[0] for conflict in conflicts ]             
        except RuntimeWarning:
            print('Generating ownship', loop, 'Runtime Warning')
            loop += 1
            continue        
        if conflict_bool == test_mask:
            if conflicts[0][5] == 4 or conflicts[0][2] < minTime2Cpa:
                loop += 1
                print(loop, "Conflict at beginning or too close, skip.")
                continue
            else:
                print('Generating ownship', loop, conflict_bool == test_mask, conflict_bool)
                allFlight[1] = ownship
                break
        loop += 1

    
    ownship = allFlight[1]
    intruder = allFlight[0]
    surrounding_flight = []

    # convert to FLIGHT object for JSON serialization
    for i in range(2, n):
        surrounding_flight.append(json.dumps(SurroundingFlight(allFlight[i]).__dict__))
    
    # convert to list of JSON list, then join list to one JSON string
    # surrounding_flight = [json.dumps(flight.__dict__) for flight in surrounding_flight]
    surrounding_flight = '[%s]' % ','.join(surrounding_flight)
        
    return ownship, intruder, surrounding_flight, allFlight


def PlotScenario(scen_id, allFlight, seed, skip = []):
    fig, ax = plt.subplots(figsize=(8,8))
    circle = plt.Circle((sectorCenter[0], sectorCenter[1]), sectorRadius, color='gray', fill=False)
    i = 0
    for flight in allFlight:
        if i in skip:
            i += 1
            continue
        if i == 0:
            color = 'red'
        elif i == 1:
            color = 'blue'
        else:
            color = 'gray'
        ax.add_artist(circle)
        ax.plot([flight.sync_point_x, flight.exit_x], [flight.sync_point_y, flight.exit_y], color=color, linewidth=2)
        ax.scatter(flight.sync_point_x, flight.sync_point_y, s=40, c=color )
        i += 1
    ax.set_xlim(0, 660)
    ax.set_ylim(0, 660)
    ax.set_aspect('equal')
    title = 'Seed:' + str(seed)
    ax.set_title(title)
    plt.savefig('data/%d.png' % scen_id, dpi=150, bbox_inches='tight', pad_inches=0)
    plt.close(fig)


def DoubleCheckConflict(ownship, intruder):
    check, case = LateralConflictDetector(ownship, intruder, cpa_threshold)
    return check, case


def GenerateConflictMap(all_flight, sector_radius, grid_size, safe_dist) :

    ownship = all_flight[1] 

    all_flight.pop(1)  # remove the ownship from all_flight, this array becomes potential intruders
    
    idx = range(0, grid_size)
    
    grid_step = sector_radius * 2 / ( grid_size - 1 )

    conflict_map = np.empty( [grid_size, grid_size] )

    for i, j in product(idx, idx) :

        x = i * grid_step

        y = j * grid_step
        
        if np.sqrt( (x - sector_radius) ** 2 + (y - sector_radius) ** 2 ) > sector_radius :
            
            conflict_map[i, j] = -1  # outside the circel
            
            continue

        # clone the ownship as a resolution and adjust the midle point if the resolution to be current position x, y
        resolution = deepcopy(ownship)
        resolution.middle_x = x
        resolution.middle_y = y
        resolution.middle = np.array([x, y])
        resolution.first_segment = np.linalg.norm(resolution.entry - resolution.middle)
        resolution.second_segment = np.linalg.norm(resolution.middle - resolution.exit)
        resolution.first_dir = (resolution.middle - resolution.entry) / resolution.first_segment
        resolution.second_dir = (resolution.exit - resolution.middle) / resolution.second_segment
        resolution.exit_time = resolution.entry_time + (resolution.first_segment + resolution.second_segment) / resolution.speed
        resolution.sync_point = resolution.entry + resolution.first_dir * resolution.sync_offset
        resolution.sync_point_x = resolution.sync_point[0]
        resolution.sync_point_y = resolution.sync_point[1]
        resolution.sync_to_turn = np.linalg.norm(resolution.sync_point - resolution.middle)

        conflicts = [ LateralConflictDetector(resolution, intruder, safe_dist)[0] for intruder in all_flight ]

        if any(conflicts) :
            
            # at least one conflict
            conflict_map[i, j] = 1
            
        else :

            # no conflict
            conflict_map[i, j] = 0

    return conflict_map



# ===================================================

# Generate data frame
html_path = '/Volumes/DATA/tranngocphu@github.com/conflict-resolution-interface/cdr-interface/'
output_path = '/Volumes/DATA/tranngocphu@github.com/conflict-resolution-interface/cdr-interface/data/visitors/'

N = 6 # number of scenarios
n = 5 # number of flights in a scenario

scenario_df = pd.DataFrame()

used_seed = []

all_conflict_map_df = pd.DataFrame()

for i in range(0, N): # scenarios loop

    print("\n\n\n\n", i)
    
    while True:
        myseed = random.randint(0, 500)
        if myseed not in used_seed:
            used_seed.append(myseed)
            break
    
    random.seed(myseed)
    
    ownship = False
    while not ownship:
        ownship, intruder, surrounding_flight, all_flight = GenerateScenarioSingleLayer(n)
    
    # PlotScenario(i, allFlight, myseed)  
    WriteData(i, scenario_df, ownship, intruder, surrounding_flight)   # write data to df dataframe

    # generate conflict map
    conflict_map = GenerateConflictMap(all_flight, sectorRadius, 200, cpa_threshold)
    conflict_map = pd.DataFrame(conflict_map)
    conflict_map['scen_id'] = i
    all_conflict_map_df = all_conflict_map_df.append(conflict_map, sort=False, ignore_index=True)


write_to_file = True

filename = 'unseen_6'

if write_to_file :

    # write scenario df
    scenario_df.to_csv( output_path + filename + '.csv', index=False)
    scenario_df.to_json( output_path + filename + '.json', orient='records')

    # write conflict map df
    all_conflict_map_df.to_csv( output_path + filename + '_conflict_map.csv', index=False)

    # create demo.js from json string
    jsonf = open(output_path + filename + '.json', 'r')
    json_content = jsonf.readline()
    jsonf.close()

    jsf = open(output_path + filename + '.js', 'w+')
    jsf.write('let demo_data_1 = ' + json_content + ';')
    jsf.close()

    seedf = open(output_path + filename + '_SEED.txt', 'w+')
    seedf.write(str(used_seed))
    seedf.close()
