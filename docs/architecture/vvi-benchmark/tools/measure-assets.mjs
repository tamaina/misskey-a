/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
const base=path.dirname(new URL(import.meta.url).pathname);const stage=process.env.MEASURE_STAGE??'final-output';const cache=new Map(),results=[];
async function walk(root){let all=[];for(const e of await fs.readdir(root,{withFileTypes:true})){const p=path.join(root,e.name);if(e.isDirectory())all.push(...await walk(p));else if(e.isFile())all.push(p)}return all.sort()}
for(const app of ['frontend','frontend-embed'])for(const strategy of ['virtual','inline-chunks']){
 const root=path.join(base,'runs-corrected','smoke-'+app+'-'+strategy,stage),files=[],categories={},totals={raw:0,gzip9:0,brotli5:0,files:0};
 for(const p of await walk(root)){const data=await fs.readFile(p),sha=createHash('sha256').update(data).digest('hex'),ext=path.extname(p).toLowerCase(),compress=['.js','.css','.json','.html','.svg','.txt','.map'].includes(ext);if(!cache.has(sha))cache.set(sha,{raw:data.length,gzip9:compress?gzipSync(data,{level:9}).length:data.length,brotli5:compress?brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:5}}).length:data.length});const sizes=cache.get(sha);files.push({path:path.relative(root,p),sha256:sha,...sizes,encodedWhenServed:compress});const category=categories[ext||'(none)']??={raw:0,gzip9:0,brotli5:0,files:0};for(const key of ['raw','gzip9','brotli5']){totals[key]+=sizes[key];category[key]+=sizes[key]}totals.files++;category.files++;}
 results.push({app,strategy,totals,categories,files});console.log(JSON.stringify({app,strategy,totals}));
}
await fs.writeFile(path.join(base,stage==='final-output'?'asset-sizes.json':'asset-sizes-vite.json'),JSON.stringify({stage,scope:'All selected output stage files, logical bytes, not du disk allocation. Text gzip9/brotli5; binary assets remain raw. Offline hypothetical encodings: loopback browser server is uncompressed. No dedup across separately served files.',results},null,2)+'\n');
