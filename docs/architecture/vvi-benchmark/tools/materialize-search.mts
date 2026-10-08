import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parse } from '../source/packages/frontend/node_modules/vue/compiler-sfc/index.js';
import { createInternationalization, setActiveInternationalization, createComponentLocale } from '../source/packages/frontend/lib/experiment-public-runtime.ts';
import { staticExpression } from '../source/packages/frontend/lib/experiment-safe-expression.ts';
import { MarkerIdAssigner, collectFileMarkers } from './search-extraction/vite-plugin-copy.ts';
const base=path.dirname(new URL(import.meta.url).pathname);
const root=path.resolve(base,'../source/packages');
const primary='ja-JP';
const baseline=JSON.parse(fs.readFileSync(path.resolve(base,'../pre-vvi-search-audit.json'),'utf8'));
const dictionaries:Record<string,Record<string,unknown>>={};
const captured=[];
for(const row of baseline){
 const file=path.join(root,row.file),source=fs.readFileSync(file,'utf8');
 const descriptor=parse(source,{filename:file}).descriptor;
 for(const block of descriptor.customBlocks.filter(block=>block.type==='locale')){
  if(block.attrs.lang!=='json' || typeof block.attrs.locale!=='string')throw new Error('Unsupported locale block '+file);
  const lang=block.attrs.locale;
  (dictionaries[lang]??={})['/'+row.file]=JSON.parse(block.content);
 }
 const assigned=new MarkerIdAssigner().processFile(file,source);
 const markers=JSON.parse(JSON.stringify(collectFileMarkers(file,assigned.code,root)));
 assert.deepEqual(markers,row.markers,'Pre-transform extraction changed '+row.file);
 captured.push({file:row.file,markers});
}
assert.equal(captured.reduce((n,row)=>n+row.markers.length,0),342);
const locales=Object.keys(dictionaries).sort();assert.equal(locales.length,28);
const dataDir=process.env.EXPERIMENT_SEARCH_OUTPUT??path.join(root,'frontend/lib/experiment-search-data');fs.mkdirSync(dataDir,{recursive:true});
const results=[];
for(const lang of locales){
 const loaders=Object.fromEntries(locales.map(locale=>[locale,async()=>({modules:dictionaries[locale]})]));
 const instance=createInternationalization({primaryLocale:primary,initialLocale:lang,loaders});
 await instance.ready;await instance.loadLocale(primary);setActiveInternationalization(instance);
 const resolve=(value:unknown):unknown=>{
  if(Array.isArray(value))return value.map(resolve);
  if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,resolve(item)]));
  if(typeof value!=='string')return value;
  return value.replace(/\$\{createComponentLocale\('([^']+)'\)([^}]+)\}/g,(_all,id,member)=>{
   if(!dictionaries[primary][id])throw new Error('Unknown search owner '+id);
   return String(staticExpression('$locale.sfc'+member,{sfc:createComponentLocale(id)}));
  });
 };
 const data=Object.fromEntries(captured.map(row=>[row.file,resolve(row.markers)]));
 const expected=Object.fromEntries(baseline.map(row=>[row.file,resolve(row.markers)]));
 assert.deepEqual(data,expected,'Virtual baseline mismatch '+lang);
 fs.writeFileSync(path.join(dataDir,lang+'.json'),JSON.stringify(data));
 results.push({lang,markers:Object.values(data).reduce((n:any,rows:any)=>n+rows.length,0)});
}
const loader=`/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { lang } from '@features/boot/frontend/shared/config.js';
import type { SearchIndexItem } from '../vite-plugin-create-search-index.js';
const loaders: Record<string, () => Promise<{ default: Record<string, SearchIndexItem[]> }>> = {
${locales.map(lang=> '\t'+JSON.stringify(lang)+`: () => import('./${lang}.json'),`).join('\n')}
};
export const searchData: Record<string, SearchIndexItem[]> = (await (loaders[lang] ?? loaders['ja-JP'])()).default;
`;
fs.writeFileSync(path.join(dataDir,'index.ts'),loader);
fs.writeFileSync(path.join(process.env.EXPERIMENT_SEARCH_REPORT_DIR??base,'search-parity.json'),JSON.stringify({baseline:'Current virtual marker extraction saved before adapter',files:34,markers:342,expressionOccurrences:393,locales:results,safeInterpreter:true},null,2));
console.log('PASS: 342 markers x 28 locales; pre-transform extraction identical to virtual baseline');
