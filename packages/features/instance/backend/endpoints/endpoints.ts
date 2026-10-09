/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { endpointsContract } from './endpoints.contract.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type EndpointsDependencies = Pick<InstanceApiDependencies, 'readEndpoints'>;
export function createEndpointsProcedure<Actor extends ApiActor>(deps: EndpointsDependencies) {
	return createApiProcedure<Actor>()(endpointsContract)
		.handler(async ({ input, context }) => {
			return (await deps.readEndpoints()).map(endpoint => endpoint.name);
		});
}
