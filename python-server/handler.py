#!/Users/Phu/anaconda3/bin/python
import cgi
import json
import pickle

from config import python_path

form = cgi.FieldStorage()
res = form.getvalue('res')
res = json.loads(res)

with open(python_path + "data/client_data", "wb") as f :
    pickle.dump(res, f)

import agent