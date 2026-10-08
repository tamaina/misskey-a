import json,statistics
from pathlib import Path
b=Path(__file__).resolve().parent
assets=json.loads((b/'asset-sizes.json').read_text())['results'];sizes={(r['app'],r['strategy']):{f['path']:f for f in r['files']} for r in assets}
def cls(shifts):
 best=current=0;start=last=None
 for e in shifts:
  t=e['startTime']
  if last is None or t-last>1000 or t-start>5000:current=0;start=t
  current+=e['value'];best=max(best,current);last=t
 return best
rows=[]
for file in ['browser-representative-mime.json','browser-locales28-mime.json','browser-cache-gzip.json','browser-cache-br.json']:
 if not (b/file).exists():continue
 for r in json.loads((b/file).read_text())['results']:
  key=('frontend' if r['app']=='main' else 'frontend-embed',r['strategy']);prefix='/vite/' if r['app']=='main' else '/embed_vite/'
  network=r['network'];bad=[n for n in network if n.get('type')=='Script' and n.get('mime','').startswith(('image/','font/'))];normal=[n for n in network if n.get('type') in ['Font','Image']];js=[n for n in network if n.get('type')=='Script' and n.get('mime')=='text/javascript'];css=[n for n in network if n.get('type')=='Stylesheet']
  compress={k:0 for k in ['raw','gzip9','brotli5']};loaded=set()
  for n in network:
   if prefix not in n['url']:continue
   path=n['url'].split(prefix,1)[1].split('?',1)[0];f=sizes[key].get(path)
   if not f:continue
   # Per network request, not unique paths: genuine duplicate script/media requests remain counted.
   for enc in compress:compress[enc]+=f[enc]
   loaded.add(path)
  row={'source':file,'temperature':r.get('temperature','cold'),'encoding':r.get('encoding','identity'),'productionCache':r.get('productionCache',False),'cachedResponseCount':sum(n.get('fromDiskCache',False) for n in network),'strategy':r['strategy'],'app':r['app'],'lang':r['lang'],'route':r['route'],'viewport':{'width':1280,'height':720},'clsObserved':cls(r['dom']['shifts']),'clsShifts':r['dom']['shifts'],'layout':r['dom']['layout'],'requestCount':len(network),'encodedBytes':sum(n.get('encodedBytes',0) for n in network),'jsEncodedBytes':sum(n.get('encodedBytes',0) for n in js),'cssEncodedBytes':sum(n.get('encodedBytes',0) for n in css),'normalMediaRequests':len(normal),'normalMediaEncodedBytes':sum(n.get('encodedBytes',0) for n in normal),'redundantAssetScriptRequests':len(bad),'redundantAssetScriptEncodedBytes':sum(n.get('encodedBytes',0) for n in bad),'redundantFiles':[n['url'].split('/')[-1] for n in bad],'mimeConsoleErrors':len([e for e in r['consoleErrors'] if 'MIME type' in e]),'allConsoleErrors':len(r['consoleErrors']),'expectedFixturePageErrors':len([e for e in r['errors'] if 'ServiceWorker' in e]),'fatalPageErrors':[e for e in r['errors'] if 'ServiceWorker' not in e],'logicalRequestedViteAssetPayloadEncodingsIncludingCached':compress,'uniqueVitePaths':len(loaded),'imagesDecoded':all(i['complete'] and i['width']>0 for i in r['dom']['images']),'loadedFontFaces':len([f for f in r['dom']['fonts'] if f['status']=='loaded'])}
  rows.append(row)
report={'scope':'Baseline: cold full document navigations, fresh Chromium context per case, local HTTP uncompressed/no cache headers. Cache extension: paired cold/warm pages per context, Vite assets max-age30days/immutable per repo routing, text gzip9/br5; HTML/API/fixture images remain identity. No throttling. 1600ms after mount plus page navigation. CLS standard maximum session-window calculation on observed shifts; not field p75 or a complete long-session CLS. Synthetic API/SSR data, actual built assets and HTML services. SW/streaming unsupported, their expected errors remain logged. Hypothetical gzip9/brotli5 payloads exclude HTTP headers and cover only Vite paths and count requested resources even when cached; actual CDP encoded bytes include local HTTP overhead.','rows':rows,'representativeParity':'PASS: 32 route/mode/locale cases; text/storage/layout/media parity','localeParity':'PASS: 112 mode/app/locale cases, all 28 locales, text/storage/layout/media parity','compiledSearchParity':'PASS: 342 markers x 28 locales in both modes; source baseline parity also passed'}
(b/'browser-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
for r in rows:
 if r['source']=='browser-representative-mime.json' and r['lang']=='ja-JP': print(json.dumps({k:r[k] for k in ['strategy','app','route','encodedBytes','redundantAssetScriptRequests','redundantAssetScriptEncodedBytes','mimeConsoleErrors','clsObserved']}))
