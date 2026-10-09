/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { endpointContract } from './endpoint.contract.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type EndpointDependencies = Pick<InstanceApiDependencies, 'readEndpoints'>;
export function createEndpointProcedure<Actor extends ApiActor>(deps: EndpointDependencies) {
	return createApiProcedure<Actor>()(endpointContract)
		.handler(async ({ input, context }) => {
			const endpoint = (await deps.readEndpoints()).find(candidate => candidate.name === input.endpoint);
			if (endpoint == null) return null;
			return {
				params: Object.entries(endpoint.properties).map(([name, property]) => ({
					name, type: property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'string',
				}))
			};
		});
}
