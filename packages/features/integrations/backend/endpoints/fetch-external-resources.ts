/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'crypto';
import { HttpRequestService } from '../../../runtime/backend/services/HttpRequestService.js';
import { apiError } from '../../../api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import * as v from 'valibot';
import { fetchExternalResourcesErrors, fetchExternalResourcesContract } from './fetch-external-resources.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../api/backend/transport/middleware.js';
export interface FetchExternalResourcesDependencies {
	httpRequestService: Pick<HttpRequestService, 'getJson'>;
}
export function createFetchExternalResourcesProcedure(deps: FetchExternalResourcesDependencies) {
	return createApiProcedure<MiLocalUser>()(fetchExternalResourcesContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				const raw = await deps.httpRequestService.getJson<unknown>(ps.url);
				// Preserve the existing falsey-field error; malformed producer types remain server failures.
				if (raw === null || raw === undefined) throw new TypeError('Missing external resource response');
				if (typeof raw !== 'object' || !('data' in raw) || !('type' in raw) || !raw.data || !raw.type) {
					throw apiError(fetchExternalResourcesErrors.invalidSchema);
				}
				const parsed = v.safeParse(v.object({ type: v.string(), data: v.string() }), raw);
				if (!parsed.success) throw new TypeError('Invalid external resource field types');
				const res = parsed.output;
				const resHash = createHash('sha512').update(res.data.replace(/\r\n/g, '\n')).digest('hex');
				if (resHash !== ps.hash) {
					throw apiError(fetchExternalResourcesErrors.hashUnmached);
				}
				return {
					type: res.type,
					data: res.data,
				};
			})();
			return result;
		});
}
