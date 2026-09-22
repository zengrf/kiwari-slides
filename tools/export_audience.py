#!/usr/bin/env python3
"""Render a Kiwari deck to a static, audience-only directory; requires Chrome/Chromium."""
import argparse,base64,contextlib,hashlib,http.server,json,os,re,shutil,socket,subprocess,tempfile,threading,time,urllib.request
from pathlib import Path
import websocket

def free_port():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
class Browser:
 def __init__(self,port):
  for _ in range(100):
   try:
    tabs=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'));tab=next(t for t in tabs if t['type']=='page');break
   except Exception:time.sleep(.1)
  else:raise RuntimeError('Chrome did not start')
  self.ws=websocket.create_connection(tab['webSocketDebuggerUrl'],origin=f'http://127.0.0.1:{port}',timeout=120);self.i=0
 def call(self,method,params=None):
  self.i+=1;self.ws.send(json.dumps({'id':self.i,'method':method,'params':params or {}}))
  while True:
   r=json.loads(self.ws.recv())
   if r.get('id')==self.i:
    if 'error' in r:raise RuntimeError(r['error'])
    return r.get('result',{})
 def ev(self,expression):
  r=self.call('Runtime.evaluate',{'expression':expression,'awaitPromise':True,'returnByValue':True})
  if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'])
  return r['result'].get('value')
 def navigate(self,url):
  self.call('Page.navigate',{'url':url})
  for _ in range(300):
   time.sleep(.1)
   try:
    if self.ev('window.__ready===true'):return
   except Exception:pass
  raise RuntimeError('Deck did not become ready')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('source',type=Path);ap.add_argument('output',type=Path);ap.add_argument('--recordings',type=Path);args=ap.parse_args()
 source=args.source.resolve();out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
 chrome=os.environ.get('CHROME') or next((str(p) for p in [Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),Path(shutil.which('google-chrome') or '/nonexistent'),Path(shutil.which('chromium') or '/nonexistent')] if p.is_file()),None)
 if not chrome:raise SystemExit('Set CHROME to a Chrome/Chromium executable.')
 records={}
 if args.recordings:
  for path in args.recordings.glob('*.json'):
   if path.name.startswith('julia-'):continue
   record=json.loads(path.read_text());name=path.stem;record['source']=(source/'code'/f'{name}.m2').read_text();records[name]=record
 handler=lambda *a,**kw:http.server.SimpleHTTPRequestHandler(*a,directory=str(source),**kw)
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler);threading.Thread(target=server.serve_forever,daemon=True).start();port=free_port()
 with tempfile.TemporaryDirectory(prefix='kiwari-export-') as profile,open(os.devnull,'w') as log:
  process=subprocess.Popen([chrome,'--headless','--disable-gpu',f'--remote-debugging-port={port}',f'--remote-allow-origins=http://127.0.0.1:{port}',f'--user-data-dir={profile}','about:blank'],stdout=log,stderr=log)
  try:
   b=Browser(port);b.navigate(f'http://127.0.0.1:{server.server_port}/');b.ev('document.fonts.ready')
   b.ev('window.EXPORT_RECORDINGS='+json.dumps(records))
   exporter=Path(__file__).with_name('export-render.js').read_text();release=b.ev(exporter)
   assert not b.ev('mathErrors'),b.ev('mathErrors')
   for name in ['slides.css','materials.css','title-conics.js']:shutil.copy2(source/name,out/name)
   for name in ['assets','lib']:
    if (source/name).exists():shutil.copytree(source/name,out/name,dirs_exist_ok=True)
   # Rendering libraries and authoring data are not needed by the audience runtime.
   for name in ['js-yaml.min.js','marked.min.js','katex/katex.min.js']:
    (out/'lib'/name).unlink(missing_ok=True)
   for name in records:
    (out/'code').mkdir(exist_ok=True);shutil.copy2(source/'code'/f'{name}.m2',out/'code'/f'{name}.m2')
   for name in ['audience.js','audience.css']:shutil.copy2(Path(__file__).resolve().parents[1]/'audience'/name,out/name)
   template=(Path(__file__).with_name('audience.html')).read_text();payload=json.dumps(release,ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
   import html
   (out/'index.html').write_text(template.replace('RELEASE_TITLE',html.escape(release['title'])).replace('RELEASE_DATA',payload))
   manifest={'title':release['title'],'slides':len(release['slides']),'source_sha256':hashlib.sha256((source/'deck.yaml').read_bytes()).hexdigest(),'recordings':{k:{n:v[n] for n in ['version','recorded_at','source_sha256'] if n in v} for k,v in records.items()}}
   (out/'release.json').write_text(json.dumps(manifest,indent=2)+'\n')
   print(f'Exported {len(release["slides"])} audience slides to {out}',flush=True)
  finally:process.terminate();process.wait(timeout=15);server.shutdown()
if __name__=='__main__':main()
