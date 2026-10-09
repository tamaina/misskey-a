/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import { endpointsContract } from './endpoints.contract.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type EndpointsDependencies = Pick<InstanceApiDependencies, 'readEndpoints'>;
export function createEndpointsProcedure<Actor extends ApiActor>(deps: EndpointsDependencies) {
	return implement(endpointsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'endpoints' }))
		.handler(async ({ input, context }) => {
			return (await deps.readEndpoints()).map(endpoint => endpoint.name);
		});
}
