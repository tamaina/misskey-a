import os,sys,json,subprocess,time,shutil,hashlib
from pathlib import Path
b=Path(__file__).resolve().parent;root=b.parent; source=root/'source';env=dict(os.environ,EXPERIMENT_PHASE='timing')
progress=b/'timing-progress.jsonl'
if progress.exists():raise RuntimeError('Timing phase already exists; preserve it before a new matrix')
progress.write_text('')
orders=[ [('frontend','virtual'),('frontend','inline-chunks'),('frontend-embed','virtual'),('frontend-embed','inline-chunks')], [('frontend-embed','inline-chunks'),('frontend-embed','virtual'),('frontend','inline-chunks'),('frontend','virtual')], [('frontend','inline-chunks'),('frontend-embed','virtual'),('frontend','virtual'),('frontend-embed','inline-chunks')] ]
results=[]
for repetition,order in enumerate(orders,1):
 for app,strategy in order:
  for temperature in ['process-a','process-b']:
   cache=root/'cache'/app/strategy
   cacheBefore={'exists':cache.exists(),'files':sum(1 for p in cache.rglob('*') if p.is_file()) if cache.exists() else 0}
   if temperature=='process-a':shutil.rmtree(root/'cache'/app/strategy,ignore_errors=True)
   cell=f'r{repetition}-{app}-{strategy}-{temperature}'
   env['EXPERIMENT_PHASE']='timing/'+cell
   started=time.monotonic()
   with (b/('timing-'+cell+'.log')).open('w') as log:
    rc=subprocess.run([sys.executable,str(root/'run-adapter-smoke.py'),app,strategy],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT).returncode
   run=b/env['EXPERIMENT_PHASE']/f'smoke-{app}-{strategy}'
   meta=json.loads((run/'meta.json').read_text()) if (run/'meta.json').exists() else {}
   row=dict(meta,repetition=repetition,freshProcessPairMember=temperature,cell=cell,totalSeconds=time.monotonic()-started,exit=rc,run=str(run.relative_to(b)))
   row['cacheBefore']=cacheBefore;row['cacheAfter']={'exists':cache.exists(),'files':sum(1 for p in cache.rglob('*') if p.is_file()) if cache.exists() else 0}
   row['cacheDefinition']='process-a clears cacheDir; process-b retains it; both are fresh processes with clean output. No persistent cache files were observed in the measured production builds. OS filesystem page cache is not flushed. Dependencies/source fixed; one build at a time.'
   for stage in ['vite','wrapper']:
    p=run/(stage+'.time.txt')
    if p.exists():
     text=p.read_text();row[stage+'MaxRssKiB']=int(next(line.split(':',1)[1].strip() for line in text.splitlines() if 'Maximum resident set size' in line))
   results.append(row)
   with progress.open('a') as f:f.write(json.dumps(row)+'\n')
   print(json.dumps({'complete':len(results),'of':24,'cell':cell,'exit':rc,'viteSeconds':row.get('viteSeconds'),'wrapperSeconds':row.get('wrapperSeconds'),'viteMaxRssKiB':row.get('viteMaxRssKiB')}),flush=True)
   if rc:raise RuntimeError('Build failure '+cell)
(b/'timing-result.json').write_text(json.dumps({'matrix':'4 app/mode conditions x 6 fresh processes, 24 serial builds','productionChanged':False,'libraryPatchOrFiltering':False,'results':results},indent=2)+'\n')
