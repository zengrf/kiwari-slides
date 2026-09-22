#!/usr/bin/env python3
"""Local authoring and revision-checked saves; never binds a public interface."""
import argparse,json
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
import deck_store
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(deck_store.DECK_ROOT),**kw)
 def result(self,status,value):
  data=json.dumps(value).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def allowed(self):
  port=self.server.server_port;allowed={f'127.0.0.1:{port}',f'localhost:{port}'}
  return self.headers.get('Host') in allowed and (not self.headers.get('Origin') or self.headers['Origin'] in {'http://'+x for x in allowed})
 def do_GET(self):
  if not self.allowed():self.result(403,{'error':'Local authoring only.'});return
  path=urlsplit(self.path).path
  if path=='/api/slides/deck':self.result(200,deck_store.read())
  elif any(x.startswith('.') for x in path.split('/') if x):self.result(403,{'error':'Private authoring data.'})
  else:super().do_GET()
 def do_POST(self):
  if not self.allowed():self.result(403,{'error':'Local authoring only.'});return
  if self.path!='/api/slides/deck':self.result(404,{'error':'Unknown endpoint.'});return
  try:
   size=int(self.headers.get('Content-Length','0'))
   if not 0<size<=8000000:raise ValueError()
   status,result=deck_store.save(json.loads(self.rfile.read(size)))
  except (ValueError,TypeError):status,result=400,{'error':'Invalid deck.'}
  self.result(status,result)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8000);args=parser.parse_args()
 with ThreadingHTTPServer(('127.0.0.1',args.port),Handler) as server:
  print(f'Kiwari slides: http://127.0.0.1:{server.server_port}/',flush=True)
  try:server.serve_forever()
  except KeyboardInterrupt:pass
