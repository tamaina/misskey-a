/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { HttpRequestService } from '../../../runtime/backend/services/HttpRequestService.js';
import { apiError } from '../../../api/backend/transport/orpc-error.js';
import type { MiUser } from '../../../users/backend/models/User.js';
import * as v from 'valibot';
import { fetchExternalResourcesErrors, fetchExternalResourcesContract } from './fetch-external-resources.contract.js';

@Injectable()
export class FetchExternalResourcesApplicationService {
	constructor(
		private httpRequestService: HttpRequestService,
	) {}

	public async execute(ps: v.InferOutput<NonNullable<typeof fetchExternalResourcesContract['~orpc']['inputSchema']>>, _me: MiUser): Promise<v.InferOutput<NonNullable<typeof fetchExternalResourcesContract['~orpc']['outputSchema']>>> {
		const result = await (async () => {
			const raw = await this.httpRequestService.getJson<unknown>(ps.url);
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
		return v.parse(requiredSchema(fetchExternalResourcesContract['~orpc'].outputSchema), result);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
