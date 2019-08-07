# Import modules for CGI handling 
import cgi
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
import os
import json
import shutil

import copy
from sklearn.ensemble import RandomForestRegressor

from lib import *

from config import python_path
from config import img_path


#
#
# 
df = pd.read_csv(python_path + '100_5.csv')
df_train = pd.DataFrame()
df_test = pd.DataFrame()
df_ = df.sample(frac=0.8,random_state=200)
df_train = df_train.append(df_)
df_test = df_test.append(df.drop(df_.index))

#
#
# 
max_num = 5
model = train_agent(df_train, 330, max_num)

df_map = pd.read_csv(python_path + 'map.csv',delimiter=',', header=0)

# All_Map = []
# for step in range(len(df_map)//200):
#     F_Res = []
    
#     c = 0
#     for i in range(200):
#         for j in range(step*200, (step+1)*200):
#             c += df_map[str(i)][j]
#             if int(df_map[str(i)][j]) == 0:
#                 F_Res.append([(j-step*200)*3.3,i*3.3])
#     print(step)
#     All_Map.append(F_Res)

# with open(python_path + "all_map", "wb") as f :
#     pickle.dump(All_Map, f)

with open(python_path + "all_map", 'rb') as f :
    All_Map = pickle.load(f)


#
#
# prepare html template:
img_element = """<div class="col-md-4 col-lg-3 col-xl-2 pt-2 pb-2"><img class="img-fluid res-img" src="data/img/<img_file>"></img></div>"""
pre_train_data = ''
new_train_data = ''

if os.path.exists("img"):
    shutil.rmtree("img")
os.makedirs("img")

# test process
df_test_ = df_test
for i in range(len(df_test_)):

    

    Y = predict_agent(model, df_test_.iloc[i], 330, max_num)
    F_Res = np.array(All_Map[df_test_.index[i]])
    l_score = score(F_Res, Y) 
    Pred_P = F_Res[np.argmin(l_score)]

    fig, ax = plt.subplots()

    ax.scatter(F_Res[:,0],F_Res[:,1],c=l_score)
    ax.scatter(Y[0][0],Y[0][1], c='r')
    ax.scatter( df_test_.iloc[i].res_x,df_test_.iloc[i].res_y, c='b')
    ax.scatter(Pred_P[0],Pred_P[1], c='g')
    ax.plot([df_test_.iloc[i].entry_x_1, df_test_.iloc[i].exit_x_1],[df_test_.iloc[i].entry_y_1, df_test_.iloc[i].exit_y_1], c= 'b')
    ax.plot([df_test_.iloc[i].entry_x_0, df_test_.iloc[i].exit_x_0],[df_test_.iloc[i].entry_y_0, df_test_.iloc[i].exit_y_0], c= 'r')

    ax.scatter(660, 660, c='white', s=0)
    # plt.title(df_test_.index[i])
    plt.axis([0, 660, 0, 660])
    ax.set_aspect('equal')
    # ax.set_axis_off()
    # ax.xaxis.set_major_locator(mt.NullLocator())
    # ax.yaxis.set_major_locator(mt.NullLocator())
    fig.savefig(img_path + "%d.png" % i, dpi=72, bbox_inches='tight', pad_inches=0, transparent=True)

    
    this_img = img_element.replace( "<img_file>", "%d.png" % i )

    if i < 6 :
        pre_train_data += this_img
    else :
        new_train_data += this_img

    if i == 11 :
        break

response = {
    "stt" : True,
    "pre_data": pre_train_data,
    "new_data": new_train_data
}

response = json.dumps(response)

print ('Content-type: application/json\n\n')
print (response)
