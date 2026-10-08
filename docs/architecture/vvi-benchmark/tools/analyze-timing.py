from pathlib import Path
import json,statistics
b=Path(__file__).resolve().parent;x=json.loads((b/'timing-result.json').read_text());rows=x['results'];assert len(rows)==24 and all(r['exit']==0 for r in rows)
summaries=[]
for app in ['frontend','frontend-embed']:
 for strategy in ['virtual','inline-chunks']:
  for temp in ['combined']:
   r=[v for v in rows if v['app']==app and v['strategy']==strategy and (temp=='combined' or v['temperature']==temp)]
   def stats(vals):return {'median':statistics.median(vals),'min':min(vals),'max':max(vals),'samples':len(vals)}
   summaries.append({'app':app,'strategy':strategy,'cacheLabel':temp,'viteSeconds':stats([v['viteSeconds'] for v in r]),'wrapperSeconds':stats([v['wrapperSeconds'] for v in r]),'pipelineSeconds':stats([v['viteSeconds']+v['wrapperSeconds'] for v in r]),'peakProcessRssMiB':stats([max(v['viteMaxRssKiB'],v.get('wrapperMaxRssKiB',0))/1024 for v in r])})
report={'runs':24,'allPassed':True,'summaries':summaries,'cacheFinding':'Production Vite build created no persistent cacheDir files in any measured run. Six fresh processes per condition, clean outputs, OS page cache uncontrolled/not flushed. No persistent build-cache or machine-cold comparison is demonstrated.','pipelineTimeDefinition':'Vite external process wall seconds plus virtual wrapper external process wall seconds. Excludes artifact-copy/measurement bookkeeping (totalSeconds records that separately). Common main-only search preparation measured once separately:14.92s,1690732KiB RSS; include its cost if regenerated on each main build, amortize only when unchanged. Embed has no search data preparation.','rssDefinition':'/usr/bin/time maximum RSS, peak process statistic across sequential Vite/wrapper stages, not aggregate host memory. Node max-old-space-size2048MiB.','measurementDesign':'Three repetitions, reversed/rotated condition order, each cold then paired warm, strictly serial; no source/dependency/library changes or preload filters.'}
(b/'timing-summary.json').write_text(json.dumps(report,indent=2)+'\n')
for r in summaries:
 if r['cacheLabel']=='combined': print(r['app'],r['strategy'],'pipeline',r['pipelineSeconds'],'RSS MiB',r['peakProcessRssMiB'])
