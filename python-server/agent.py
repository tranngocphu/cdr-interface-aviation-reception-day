import tensorflow as tf
import numpy as np
import gym
from gym import wrappers
import tflearn
import argparse
import pprint as pp
import numpy
import pandas as pd
import random
import matplotlib.pyplot as plt
import matplotlib.ticker as mt
from matplotlib import cm as CM
from matplotlib import path
import itertools
import scipy.misc
import pickle
import json
import string

import copy
from sklearn.ensemble import RandomForestRegressor

from lib import *

from config import python_path
from config import img_path


# function to randomize a string with given length
def random_string(stringLength=8):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))


# useful vars

max_num = 5 # number of flight

# ===============
# PRE TRAIN MODEL
# ===============

# prepare for training of pre-trained model

df = pd.read_csv(python_path + 'data/pre_train_data.csv')
df_train = pd.DataFrame()
df_test = pd.DataFrame()
df_ = df.sample(frac=0.8,random_state=200)
df_train = df_train.append(df_)
df_test = df_test.append(df.drop(df_.index))

pre_model = train_agent(df_train, 330, max_num)

## save pre model to a pickle
# with open(python_path + "pre_model", "wb") as f :
#     pickle.dump(pre_model, f)

# load pre model from pickle
with open(python_path + "data/pre_train_model", 'rb') as f :
    pre_model = pickle.load(f)


# # get feasible res from the conflict map...
# df_map = pd.read_csv(python_path + 'map.csv',delimiter=',', header=0)
# all_map = feasible_res_from_map (df_map)

# ... or load all_map from pickle
# with open(python_path + "data/pre_train_all_map", 'rb') as f :
#     pre_all_map = pickle.load(f)


# ===============
# NEW TRAIN MODEL
# ===============

# load data received from the client after visitor finished 20 scenarios
# the pickle was created in handler.py 
with open(python_path + "data/client_data", 'rb') as f :
    client_data = pickle.load(f)

# load 20 conflict scenarios
demo_id = client_data['demo_id']
conflict_file = 'demo' + str(demo_id) + '.csv'
map_file = 'demo' + str(demo_id) + '_conflict_map.csv'
df_20_conflict = pd.read_csv(python_path + 'data/'+ conflict_file)

# load 20 resolution: res_data = [ [x, y], [x, y ], ... ]
res_data = client_data['data']

# combine them wherever reoslution is available. this is training data too
for i in range(0, len(res_data)) :
    df_20_conflict.at[i, "res_x"] = res_data[i][0]
    df_20_conflict.at[i, "res_y"] = res_data[i][1]

df_20_conflict = df_20_conflict.head(len(res_data))

# train the new model
new_model = train_agent(df_20_conflict, 330, max_num)

# # new feasible map
# df_new_map = pd.read_csv(python_path + 'data/' + map_file, delimiter=',', header=0)
# new_all_map = feasible_res_from_map(df_new_map)

# ===============
# TEST TWO MODELS
# ===============

# prepare html template:
img_element = """<div class="col-md-4 col-lg-3 col-xl-2 pt-2 pb-2"><div class="acceptance-label" id="label-@label" name="@id-@x-@y"></div><img class="img-fluid res-img" src="data/img/<img_file>" onclick="run_res(@id, @x, @y);"></img></div>"""
pre_train_data = ''
new_train_data = ''


# Test on 6 unseen scenarios. 
# Test df preparation:
df_test_ = pd.read_csv(python_path + 'data/unseen_6.csv')
df_test_['res_x'] = 0
df_test_['res_y'] = 0

# prepare heat map of test scenarios
# df_test_map = pd.read_csv(python_path + 'data/unseen_6_conflict_map.csv', delimiter=',', header=0)
# test_map = feasible_res_from_map(df_test_map)

# ## save test heat map to a pickle
# with open(python_path + 'data/unseen_map_pickle', "wb") as f :
#     pickle.dump(test_map, f)

# ... or load test heat map from pickle
with open(python_path + 'data/unseen_map_pickle', 'rb') as f :
    test_map = pickle.load(f)


plot_count = 0  # this is to identify all 12 plots

# Test the new-trained model
for i in range(len(df_test_)) :
    
    img_file = random_string(8) +  '_%d.png' % i

    Y = predict_agent(new_model, df_test_.iloc[i], 330, max_num)
    F_Res = np.array(test_map[df_test_.index[i]])
    l_score = score(F_Res, Y)
    Pred_P = F_Res[np.argmin(l_score)]

    scenario = converting_scenario(df_test_.iloc[i])
   
    fig, ax = plt.subplots()   

    #plot heatmap
    ax.scatter(F_Res[:,0],F_Res[:,1],c=-l_score, alpha=0.1, cmap='Oranges')

    #plot ownship with resolution
    ax.plot([scenario.iloc[0].entry_x,Pred_P[0], scenario.iloc[0].exit_x],[scenario.iloc[0].entry_y,Pred_P[1], scenario.iloc[0].exit_y], 'b-.',linewidth=2.0)
    ax.plot([scenario.iloc[0].entry_x, scenario.iloc[0].exit_x],[scenario.iloc[0].entry_y, scenario.iloc[0].exit_y], 'b-',linewidth=3.0)
    ax.scatter([scenario.iloc[0].entry_x], [scenario.iloc[0].entry_y], s=100,  c='b')

    #plot intruder
    ax.plot([scenario.iloc[1].entry_x,scenario.iloc[1].middle_x, scenario.iloc[1].exit_x],[scenario.iloc[1].entry_y,scenario.iloc[1].middle_y, scenario.iloc[1].exit_y], 'r-',linewidth=3.0)
    ax.scatter([scenario.iloc[1].entry_x], [scenario.iloc[1].entry_y], s=100,  c='r')

    #plot surrounding traffic
    for f in range(2,len(scenario)):
        ax.plot([scenario.iloc[f].entry_x,scenario.iloc[f].middle_x, scenario.iloc[f].exit_x],[scenario.iloc[f].entry_y,scenario.iloc[f].middle_y, scenario.iloc[f].exit_y], 'gray',linewidth=2.0)
        ax.scatter([scenario.iloc[f].entry_x], [scenario.iloc[f].entry_y], s=100,  c='gray')

    #plot boundary circle
    circle = plt.Circle((330, 330), 334, color='black',fill=False,linewidth=1.5,alpha = 0.4)
    ax.add_artist(circle)

    plt.axis([-20, 680, -20, 680])
    ax.set_aspect('equal')
    ax.axis('off')
    fig.savefig(img_path + img_file, dpi=48, bbox_inches='tight', pad_inches=0)
      
    plot_count += 1
    this_img = img_element.replace( "<img_file>", img_file )
    this_img = this_img.replace("@id", str(i))
    this_img = this_img.replace("@x", str(Pred_P[0]))
    this_img = this_img.replace("@y", str(660 - Pred_P[1]))
    this_img = this_img.replace("@label", str(plot_count))
    new_train_data += this_img


# Test the pre-trained model
for i in range(len(df_test_)) :
    
    img_file = random_string(8) + '_pre_%d.png' % i

    Y = predict_agent(pre_model, df_test_.iloc[i], 330, max_num)
    F_Res = np.array(test_map[df_test_.index[i]])
    l_score = score(F_Res, Y) 
    Pred_P = F_Res[np.argmin(l_score)]

    scenario = converting_scenario(df_test_.iloc[i])

    fig, ax = plt.subplots()   

    #plot heatmap
    ax.scatter(F_Res[:,0],F_Res[:,1],c=-l_score, alpha=0.1, cmap='Oranges')

    #plot ownship with resolution
    ax.plot([scenario.iloc[0].entry_x,Pred_P[0], scenario.iloc[0].exit_x],[scenario.iloc[0].entry_y,Pred_P[1], scenario.iloc[0].exit_y], 'b-.',linewidth=2.0)
    ax.plot([scenario.iloc[0].entry_x, scenario.iloc[0].exit_x],[scenario.iloc[0].entry_y, scenario.iloc[0].exit_y], 'b-',linewidth=3.0)
    ax.scatter([scenario.iloc[0].entry_x], [scenario.iloc[0].entry_y], s=100,  c='b')

    #plot intruder
    ax.plot([scenario.iloc[1].entry_x,scenario.iloc[1].middle_x, scenario.iloc[1].exit_x],[scenario.iloc[1].entry_y,scenario.iloc[1].middle_y, scenario.iloc[1].exit_y], 'r-',linewidth=3.0)
    ax.scatter([scenario.iloc[1].entry_x], [scenario.iloc[1].entry_y], s=100,  c='r')

    #plot surrounding traffic
    for f in range(2,len(scenario)):
        ax.plot([scenario.iloc[f].entry_x,scenario.iloc[f].middle_x, scenario.iloc[f].exit_x],[scenario.iloc[f].entry_y,scenario.iloc[f].middle_y, scenario.iloc[f].exit_y], 'gray',linewidth=2.0)
        ax.scatter([scenario.iloc[f].entry_x], [scenario.iloc[f].entry_y], s=100,  c='gray')

    #plot boundary circle
    circle = plt.Circle((330, 330), 334, color='black',fill=False,linewidth=1.5,alpha = 0.4)
    ax.add_artist(circle)

    plt.axis([-20, 680, -20, 680])
    ax.set_aspect('equal')
    ax.axis('off')
    fig.savefig(img_path + img_file, dpi=48, bbox_inches='tight', pad_inches=0)
    
    plot_count += 1
    this_img = img_element.replace( "<img_file>", img_file )
    this_img = this_img.replace("@id", str(i))
    this_img = this_img.replace("@x", str(Pred_P[0]))
    this_img = this_img.replace("@y", str(660 - Pred_P[1]))
    this_img = this_img.replace("@label", str(plot_count))
    pre_train_data += this_img


# Prepare response to the frontend

response = {
    'stt' : 1,
    'pre_data' : pre_train_data,
    'new_data' : new_train_data
}

response = json.dumps(response)

print ("Content-Type: application/json\n\n")

print (response)