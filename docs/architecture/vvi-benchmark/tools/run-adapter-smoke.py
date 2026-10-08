import json,os,subprocess,time,shutil,hashlib,sys
from pathlib import Path
base=Path(__file__).resolve().parent
source=base/'source'
app=sys.argv[1];strategy=sys.argv[2]
assert app in ('frontend','frontend-embed') and strategy in ('virtual','inline-chunks')
run=base/'adapter'/os.environ.get('EXPERIMENT_PHASE','runs')/('smoke-'+app+'-'+strategy);run.mkdir(parents=True,exist_ok=True)
config=source/'packages'/app/'vite.config.ts'
s=(base/(app+'-vite.config.baseline.ts')).read_text()
old='pluginVvi({ embed: true })' if app=='frontend-embed' else 'pluginVvi()'
new="pluginVvi({ embed: true, buildStrategy: '"+strategy+"' })" if app=='frontend-embed' else "pluginVvi({ buildStrategy: '"+strategy+"' })"
assert s.count(old)==1
s=s.replace(old,new).replace("base: '/embed_vite/'," if app=='frontend-embed' else "base: '/vite/',",("base: '/embed_vite/'," if app=='frontend-embed' else "base: '/vite/',")+"\n\t\tcacheDir: "+json.dumps(str(base/'cache'/app/strategy))+",")

if strategy=='inline-chunks':
 s='\n'.join(line for line in s.splitlines() if not ("i18n: '../features/runtime/frontend/" in line))+'\n'
config.write_text(s)
output=source/'built'/('_frontend_embed_vite_' if app=='frontend-embed' else '_frontend_vite_')
if output.exists() and '--wrapper-only' not in sys.argv:shutil.rmtree(output)
meta={'app':app,'strategy':strategy,'stage':'integration-smoke','nodeHeapMiB':2048,'configSha256':hashlib.sha256(config.read_bytes()).hexdigest(),'memoryBefore':subprocess.check_output(['free','-b'],text=True)}
if '--wrapper-only' not in sys.argv:(run/'meta.json').write_text(json.dumps(meta,indent=2)+'\n')
env=dict(os.environ,NODE_OPTIONS='--max-old-space-size=2048',NODE_ENV='production')
cli=(source/'packages'/app/'node_modules/vite/bin/vite.js').resolve()
if len(sys.argv)>3 and sys.argv[3]=='--wrapper-only':
 meta=json.loads((run/'meta.json').read_text());meta['harnessRepair']='Wrapper .mts/module resolution only; Vite output unchanged';rc=meta['viteExit']
else:
 t=time.monotonic()
 with (run/'vite.log').open('w') as log:
  rc=subprocess.run(['/usr/bin/time','-v','-o',str(run/'vite.time.txt'),'node',str(cli),'build'],cwd=source/'packages'/app,env=env,stdout=log,stderr=subprocess.STDOUT).returncode
 meta.update(viteExit=rc,viteSeconds=time.monotonic()-t,memoryAfterVite=subprocess.check_output(['free','-b'],text=True))
if rc==0:
 if not (run/'vite-output').exists():shutil.copytree(output,run/'vite-output')
 if strategy=='inline-chunks':
  hits=[str(p.relative_to(output)) for p in output.rglob('*.js') if '/assets/locales/' in p.read_text()]
  (run/'legacy-reference-audit.json').write_text(json.dumps({'localeFetchReferences':hits},indent=2))
  if hits:raise RuntimeError('Cannot skip wrapper with retained legacy locale fetch: '+str(hits[:3]))
  meta.update(wrapperExit=0,wrapperSeconds=0,wrapperSkipped='No legacy locale-fetch output references after source-based search and obsolete explicit i18n input removal; bootloader/public assets retained')
  shutil.move(output,run/'final-output')
 else:
  wrapper=base/'wrapper.mts'
  wrapper.write_text("import { performance } from 'node:perf_hooks';\nimport { LocaleInliner } from './source/packages/frontend-builder/locale-inliner.ts';\nimport { createLogger } from './source/packages/frontend-builder/logger.ts';\nimport locales from './source/packages/i18n/built/index.js';\nconst outputDir=process.argv[2]; const embed=process.argv[3]==='embed';\nconst times:any={};let t=performance.now();\nconst logger=createLogger();\nconst inliner=await LocaleInliner.create({outputDir,logger,scriptsDir:'scripts',i18nFile:embed?'../features/runtime/frontend/embed/i18n.ts':'../features/runtime/frontend/i18n.ts',legacyLabels:'absent'});\ntimes.create=performance.now()-t;t=performance.now();await inliner.loadFiles();times.load=performance.now()-t;t=performance.now();inliner.collectsModifications();times.collect=performance.now()-t;t=performance.now();await inliner.saveAllLocales(locales);times.write=performance.now()-t;\nif(logger.errorCount>0)throw new Error('Wrapper errors '+logger.errorCount);\nconsole.log('BENCH_PHASES '+JSON.stringify(times));\n")
  tsx=(source/'packages'/app/'node_modules/tsx/dist/cli.mjs').resolve()
  t=time.monotonic()
  with (run/'wrapper.log').open('w') as log:
   rc=subprocess.run(['/usr/bin/time','-v','-o',str(run/'wrapper.time.txt'),'node',str(tsx),str(wrapper),str(output),'embed' if app=='frontend-embed' else 'main'],cwd=source/'packages'/app,env=env,stdout=log,stderr=subprocess.STDOUT).returncode
  meta.update(wrapperExit=rc,wrapperSeconds=time.monotonic()-t,memoryAfterWrapper=subprocess.check_output(['free','-b'],text=True))
  if rc==0:shutil.move(output,run/'final-output')
(run/'meta.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta,indent=2));sys.exit(rc)
