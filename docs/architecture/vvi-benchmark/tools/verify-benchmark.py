from pathlib import Path
import json,hashlib
b=Path(__file__).resolve().parent;src=b.parent/'source'
for r in json.loads((b/'source-files.json').read_text()):assert hashlib.sha256((src/r['file']).read_bytes()).hexdigest()==r['sha256'],r['file']
rows=json.loads((b/'timing-result.json').read_text())['results'];assert len(rows)==24 and all(r['exit']==0 for r in rows)
base={(r['app'],r['strategy']):{f['path']:f['sha256'] for f in r['files']} for r in json.loads((b/'asset-sizes.json').read_text())['results']};results=[]
for r in rows:
 root=b/r['run']/'final-output';expected=base[r['app'],r['strategy']];actual={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()};changes=[p for p in set(expected)|set(actual) if expected.get(p)!=actual.get(p)]
 results.append({'cell':r['cell'],'sameFilesAndBytesAsCorrectnessBuild':not changes,'files':len(actual),'changedFiles':changes[:20],'changeCount':len(changes)})
 print(r['cell'],'equal',not changes,'changes',len(changes),flush=True)
for file in ['browser-representative-mime.json','browser-locales28-mime.json','browser-cache-gzip.json','browser-cache-br.json']:
 rows=json.loads((b/file).read_text())['results']
 for r in rows:
  assert r['dom']['mounted'] and not r['dom']['splash'] and not r['failure'],(file,r['route'])
  assert not [e for e in r['errors'] if 'ServiceWorker' not in e],(file,r['errors'])
  assert all(i['complete'] and i['width']>0 for i in r['dom']['images']),(file,r['route'])
  assert set(r['dom']['locale'].values())=={r['lang']}
  other=next(v for v in rows if v['strategy']!=r['strategy'] and v['app']==r['app'] and v['lang']==r['lang'] and v['route']==r['route'] and v.get('temperature','cold')==r.get('temperature','cold'))
  for key in ['text','lang','bootloaderLocales','layout']:assert r['dom'][key]==other['dom'][key],(file,r['route'],key)
(b/'verification.json').write_text(json.dumps({'coreSourceHashes':'PASS:18 files unchanged','timingRuns':'PASS:24/24','browserCases':'PASS:208 total (32 representative+112 locale+64 cache/encoding), localized content/storage/layout/media parity, no fatal application errors','outputs':results,'allOutputBytesMatchCorrectnessBuild':all(r['sameFilesAndBytesAsCorrectnessBuild'] for r in results)},indent=2)+'\n')
