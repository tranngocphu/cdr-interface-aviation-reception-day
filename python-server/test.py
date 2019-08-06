#! /Users/Phu/anaconda3/bin/python

import cgi
import json
import matplotlib.pyplot as plt
import numpy as np

path = '/Volumes/Data/tranngocphu@github.com/conflict-resolution-interface/cdr-interface/data/img/'

img_html = """<div class="col-md-4 col-lg-3 col-xl-2 pt-2 pb-2"><img class="img-fluid res-img" src="data/img/<file_name>"></img></div>"""

file_list = []

data = ''

for i in range(0,6):

    img = "test" + str(i) + ".png"
    Z = np.random.random((5,5))   # Test data
    fig, ax = plt.subplots()
    ax.imshow(Z, cmap="hsv", interpolation='nearest')
    ax.set_axis_off()
    fig.savefig(path + img, bbox_inches='tight')
    file_list.append(img)

    this_img = img_html.replace( "<file_name>", img )
    data += this_img


file_list = json.dumps(file_list)

response = {
    "stt" : True,
    "msg" : file_list,
    "data": data 
}

response = json.dumps(response)

print ('Content-type: application/json\n\n')
print (response)