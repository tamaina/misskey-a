/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';

// This boundary ignores the complete request body, including arbitrary JSON values.
const input = v.unknown();
const output = v.void();
export const clearBrowserCacheContract = oc.$meta<{
 requestName: 'clear-browser-cache'; allowGet: true; introspection: false; ignoreBody: true; acceptedMethods: readonly ['GET', 'POST'];
}>({ requestName: 'clear-browser-cache', allowGet: true, introspection: false, ignoreBody: true, acceptedMethods: ['GET', 'POST'] })
 .route({ method: 'POST', path: '/clear-browser-cache', operationId: 'post___clear_browser_cache', tags: ['non-productive'], successStatus: 204 })
 .input(input).output(output);
export const clearBrowserCacheGetContract = oc
 .route({ method: 'GET', path: '/clear-browser-cache', operationId: 'get___clear_browser_cache', tags: ['non-productive'], successStatus: 204 })
 .input(input).output(output);
