# SPDX-FileCopyrightText: syuilo and misskey-project
# SPDX-License-Identifier: AGPL-3.0-only
"""Prepare a new isolated benchmark; never install into linked dependencies."""
import argparse,json,shutil,subprocess,tarfile
from pathlib import Path
BASE='4a208034cf1c77696e2e72cd50293d189e53e52a'
parser=argparse.ArgumentParser();parser.add_argument('workspace',type=Path);parser.add_argument('--checkout',type=Path);parser.add_argument('--asset-probe',action='store_true');args=parser.parse_args()
bundle=Path(__file__).resolve().parent;repo=(args.checkout or bundle.parents[2]).resolve();work=args.workspace.resolve()
if args.asset_probe:
    out=work/'adapter/runs-corrected/smoke-frontend-embed-inline-chunks/final-output/assets'
    fonts=sorted(out.glob('*.woff2'),key=lambda p:p.stat().st_size,reverse=True)
    if len(fonts)!=2:raise RuntimeError('Expected two emitted font assets for the pinned fixture')
    shutil.copyfile(fonts[0],work/'adapter/asset-minimal/font-a.woff2');shutil.copyfile(fonts[1],work/'adapter/asset-minimal/font-b.woff2')
else:
    if work.exists():raise RuntimeError('Use a new workspace; preserve existing results')
    for name in ['frontend','backend','frontend-embed','frontend-builder','misskey-js','icons-subsetter','i18n','sw']:
        if not (repo/'packages'/name/'node_modules').exists():raise RuntimeError('Prepare dependencies in a matching checkout first: '+name)
    for name in ['misskey-js','icons-subsetter','i18n','misskey-reversi','misskey-bubble-game']:
        if not (repo/'packages'/name/'built').exists():raise RuntimeError('Build prerequisites in a matching checkout first: '+name)
    work.mkdir(parents=True);archive=work/'source.tar';subprocess.run(['git','archive','--format=tar','--output',str(archive),BASE],cwd=repo,check=True)
    source=work/'source';source.mkdir()
    with tarfile.open(archive) as t:t.extractall(source,filter='data')
    subprocess.run(['git','apply','--unidiff-zero',str(bundle/'prototype.patch')],cwd=source,check=True)
    (source/'node_modules').symlink_to(repo/'node_modules',target_is_directory=True)
    for pkg in (source/'packages').iterdir():
        if not pkg.is_dir():continue
        for name in ['node_modules','built']:
            origin=repo/'packages'/pkg.name/name
            if not origin.exists():continue
            target=pkg/name
            if target.exists():continue
            if pkg.name=='misskey-js' and name=='built':shutil.copytree(origin,target)
            else:target.symlink_to(origin,target_is_directory=True)
    (work/'node_modules').symlink_to(repo/'packages/backend/node_modules',target_is_directory=True)
    shutil.copyfile(bundle/'source-search-baseline.json',work/'pre-vvi-search-audit.json')
    for pkg in ['frontend','frontend-embed']:shutil.copyfile(source/'packages'/pkg/'vite.config.ts',work/(pkg+'-vite.config.baseline.ts'))
    tools=bundle/'tools';adapter=work/'adapter';shutil.copytree(tools,adapter)
    shutil.move(adapter/'run-adapter-smoke.py',work/'run-adapter-smoke.py')
    for name in ['asset-minimal','minimal']:(adapter/name/'node_modules').symlink_to(repo/'packages/frontend/node_modules',target_is_directory=True)
    shutil.copyfile(source/'packages/frontend/assets/unknown.png',adapter/'asset-minimal/image.png')
    (adapter/'browser-root/built').mkdir(parents=True)
    (adapter/'browser-root/built/_frontend_vite_').symlink_to(adapter/'runs-corrected/smoke-frontend-virtual/final-output',target_is_directory=True)
    (adapter/'browser-root/built/_frontend_embed_vite_').symlink_to(adapter/'runs-corrected/smoke-frontend-embed-virtual/final-output',target_is_directory=True)
    for file in ['source-files.json','search-parity.json']:
        data=json.loads((bundle/'measurements.json').read_text());payload=data['prototypeCoreSourceHashes'] if file=='source-files.json' else {'locales':[{'lang':lang} for lang in sorted({r['lang'] for r in data['browser']['rows']})]}
        (adapter/file).write_text(json.dumps(payload,indent=2)+'\n')
print('Prepared owned workspace:',work)
