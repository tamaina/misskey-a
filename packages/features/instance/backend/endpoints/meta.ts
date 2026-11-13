/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPublicMetaLite, toPublicMetaDetailed } from '../serializers/public-meta.js';
import { metaContract } from './meta.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type MetaDependencies = Pick<InstanceApiDependencies, 'metaEntityService'>;
export function createMetaProcedure<Actor extends ApiActor>(deps: MetaDependencies) {
	return createApiProcedure<Actor>()(metaContract)
		.handler(async ({ input, context }) => {
			return input.detail
				? toPublicMetaDetailed(await deps.metaEntityService.packDetailed())
				: toPublicMetaLite(await deps.metaEntityService.pack());
		});
}
