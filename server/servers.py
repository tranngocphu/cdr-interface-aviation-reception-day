from threading import Thread
from http.server import HTTPServer, BaseHTTPRequestHandler
from io import BytesIO
from urllib.parse import urlparse, parse_qs
import json


# =================================================
# Common declarations
# =================================================
agent_address = 'localhost'
eeg_address   = 'localhost'
agent_port    = 8001
eeg_port      = 8002


# =================================================
# AI Agent Server
# ================================================= 
class AgentHTTPRequestHandler(BaseHTTPRequestHandler):   

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Hello, World! I am AI Agent server')

    def do_POST(self):        
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = BytesIO()       
        body = parse_qs(body.decode('utf-8'))
        # for key in body: body[key] = body[key][0]  
        body = str(body).encode()
        response.write(body)
        self.wfile.write(response.getvalue())

def StartAgentServer():
    agent_httpd = HTTPServer((agent_address, agent_port), AgentHTTPRequestHandler)
    print('AI Agent server is listening to port %s' % agent_port)
    agent_httpd.serve_forever()


# =================================================
# EEG Server
# ================================================= 
class EegHTTPRequestHandler(BaseHTTPRequestHandler):
    
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Hello, World! I am EEG server')

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_response(200)
        self.end_headers()
        response = BytesIO()
        response.write(body)
        self.wfile.write(response.getvalue())    

def StartEegServer():
    eeg_httpd = HTTPServer((eeg_address, eeg_port), EegHTTPRequestHandler)
    print('EEG server is listening to port %s' % eeg_port)
    eeg_httpd.serve_forever()


Thread(target=StartAgentServer).start()
Thread(target=StartEegServer).start()