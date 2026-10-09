/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { metaContract } from './meta.contract.js';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { InstanceApiDependencies } from '../api.dependencies.js';
export type MetaDependencies = Pick<InstanceApiDependencies, 'metaEntityService'>;
export function createMetaProcedure<Actor extends ApiActor>(deps: MetaDependencies) {
	return implement(metaContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'meta' }))
		.handler(async ({ input, context }) => {
			const packed = input.detail ? await deps.metaEntityService.packDetailed() : await deps.metaEntityService.pack();
			return v.parse(requiredSchema(metaContract['~orpc'].outputSchema), wireValue(packed));
		});
}

function wireValue(value: unknown): unknown {
	const serialized = JSON.stringify(value);
	return serialized === undefined ? undefined : JSON.parse(serialized);
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
