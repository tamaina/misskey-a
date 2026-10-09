/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../transport/context.js';
import { clearBrowserCacheContract, clearBrowserCacheGetContract } from './clear-browser-cache.contract.js';

export const clearSiteData = '"cache", "prefetchCache", "prerenderCache", "executionContexts"';

export function createClearBrowserCacheProcedure<Actor extends ApiActor>() {
 return implement(clearBrowserCacheContract).$context<ApiContext<Actor>>()
  .handler(({ context }) => { context.response?.header('Clear-Site-Data', clearSiteData); });
}
export function createClearBrowserCacheGetProcedure<Actor extends ApiActor>() {
 return implement(clearBrowserCacheGetContract).$context<ApiContext<Actor>>()
  .handler(({ context }) => { context.response?.header('Clear-Site-Data', clearSiteData); });
}
