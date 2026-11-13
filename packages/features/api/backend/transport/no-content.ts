/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Context } from '@orpc/server';
import type { StandardHandlerOptions } from '@orpc/server/standard';

/** Match the legacy top-level null/undefined success response after oRPC output validation. */
export function nullSuccessToNoContent<TContext extends Context>(): NonNullable<StandardHandlerOptions<TContext>['interceptors']>[number] {
	return async ({ next }) => {
		const result = await next();
		if (result.matched && result.response.status >= 200 && result.response.status < 300
			&& result.response.body == null) {
			return { ...result, response: { ...result.response, status: 204, body: undefined } };
		}
		return result;
	};
}
