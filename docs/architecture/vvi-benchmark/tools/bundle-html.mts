import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
import configFactory from '../source/packages/backend/rolldown.config.ts';
const base=path.dirname(new URL(import.meta.url).pathname);const repo=path.resolve(base,'../source');const require=createRequire(repo+'/packages/backend/package.json');const {rolldown}=require('rolldown');
const entry=repo+'/packages/backend/scripts/virtual-production-html-smoke.ts';
const {output,...input}=await configFactory({});delete input.watch;
const bundle=await rolldown({...input,input:entry,plugins:[...input.plugins,{name:'synthetic-production-html-probe',resolveId(id){return id===entry?entry:undefined},load(id){if(id!==entry)return;return "export { HtmlTemplateService } from '@features/web/backend/http/HtmlTemplateService.js'; export { BasePage } from '@features/web/backend/templates/base.js'; export { BaseEmbed } from '@features/web/backend/templates/base-embed.js'; export { packedMetaDetailedSchema } from '@features/instance/contract/packed.js';";}}]});
try{await bundle.write({...output,dir:path.join(base,'html-bundle'),entryFileNames:'entry.mjs',chunkFileNames:'[name]-[hash].mjs',cleanDir:true});}finally{await bundle.close();}
