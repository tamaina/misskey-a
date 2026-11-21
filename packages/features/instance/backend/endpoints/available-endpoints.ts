/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { authorizedEndpoints } from '@features/api/backend/transport/endpoint-directory.js';
import { availableEndpointsContract } from './available-endpoints.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { InstanceApiDependencies } from '../api.implementation.js';

export function createAvailableEndpointsProcedure<Actor extends ApiActor>(deps: Pick<InstanceApiDependencies, 'readApiEndpoints' | 'accessTokensRepository' | 'appsRepository'>) {
	return createApiProcedure<Actor>()(availableEndpointsContract).use(requirePrincipal<Actor>()).handler(async ({ input, context }) => {
		context.response?.header('Cache-Control', 'no-store');
		let token = context.token;
		if (token?.id) {
			const grant = await deps.accessTokensRepository.findOneBy({ id: token.id, userId: context.principal.id });
			const permission = grant?.appId ? (await deps.appsRepository.findOneBy({ id: grant.appId }))?.permission : grant?.permission;
			if (!permission) throw apiError({ code: 'AUTHENTICATION_FAILED', status: 401, message: 'Authentication failed.', id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14' });
			token = { ...token, permission };
		}
		const endpoints = await authorizedEndpoints(await deps.readApiEndpoints(), { ...context, token });
		return {
			permissions: token ? [...token.permission] : null,
			endpoints: endpoints.map(endpoint => endpoint.name).sort(),
			definitions: input.endpoint === undefined ? [] : endpoints.filter(endpoint => endpoint.name === input.endpoint)
				.map(endpoint => ({ name: endpoint.name, permission: endpoint.policy.kind ?? null, inputSchema: endpoint.inputSchema, mcpSupported: endpoint.mcpSupported })),
		};
	});
}
