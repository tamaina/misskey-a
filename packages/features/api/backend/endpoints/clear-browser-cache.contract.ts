/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';

// This boundary ignores the complete request body, including arbitrary JSON values.
export const clearBrowserCacheContract = oc.$meta({ requestName: 'clear-browser-cache', allowGet: true, introspection: false, ignoreBody: true, acceptedMethods: ['GET', 'POST'] } as const)
 .route({ method: 'POST', path: '/clear-browser-cache', operationId: 'post___clear_browser_cache', tags: ['non-productive'], successStatus: 204 })
 .input(v.unknown()).output(v.void());
export const clearBrowserCacheGetContract = oc
 .route({ method: 'GET', path: '/clear-browser-cache', operationId: 'get___clear_browser_cache', tags: ['non-productive'], successStatus: 204 })
 .input(v.unknown()).output(v.void());
