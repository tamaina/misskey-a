from pathlib import Path
import json,hashlib
b=Path(__file__).resolve().parent; src=b.parent/'source/packages/frontend'; root=b/'search-extraction';root.mkdir(exist_ok=True)
modules=root/'node_modules'
if not modules.exists():modules.symlink_to((src/'node_modules').resolve(),target_is_directory=True)
plugin=(src/'lib/vite-plugin-create-search-index.ts').read_text();config=(src/'vite.config.ts').read_text()
hash_functions=config[config.index('export const hash ='):config.index('export function getConfig()')]
old="import { hash, toBase62 } from '../vite.config';";assert plugin.count(old)==1;plugin=plugin.replace(old,hash_functions)
old="'./experiment-safe-expression.js'";assert plugin.count(old)==1;plugin=plugin.replace(old,"'../../source/packages/frontend/lib/experiment-safe-expression.ts'")
(root/'vite-plugin-copy.ts').write_text(plugin)
(root/'provenance.json').write_text(json.dumps({'purpose':'Extract actual public marker functions without executing the Vite configuration. Hash/toBase62 definitions copied verbatim from that config; safe-expression import path adjusted. No product code changes.','pluginSha256':hashlib.sha256((src/'lib/vite-plugin-create-search-index.ts').read_bytes()).hexdigest(),'configSha256':hashlib.sha256((src/'vite.config.ts').read_bytes()).hexdigest()},indent=2)+'\n')
