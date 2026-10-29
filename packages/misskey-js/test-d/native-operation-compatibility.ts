import { expectType } from 'tsd';
import type { operations } from '../src/autogen/types.js';
import type { paths } from '../src/autogen/types.js';

declare const report: operations['admin___abuse-user-reports']['responses'][200]['content']['application/json'];
expectType<paths['/admin/abuse-user-reports']['post']['responses'][200]['content']['application/json']>(report);

declare const clear: operations['clear_browser_cache']['responses'][204];
expectType<paths['/clear-browser-cache']['post']['responses'][204]>(clear);
