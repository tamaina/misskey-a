/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isContractProcedure } from '@orpc/contract';
import { ORPCError } from '@orpc/server';
import { requestRoutes } from '../../shared/api-routing.js';
import { assertApiAuthorization } from './middleware.js';
import type { AuthenticatedContext, ApiPolicy } from './middleware.js';
import type { ApiActor } from './context.js';
import type { ApiProcedureMetadata } from './policy.types.js';

export interface ApiEndpointDescriptor {
	name: string;
	policy: ApiPolicy;
	inputSchema: unknown;
	mcpSupported: boolean;
}

/** Read policies from the same canonical contract used by native dispatch. */
export function endpointPolicies(contract: unknown) {
	return requestRoutes(contract).filter(route => route.introspection !== false).map(route => {
		let node: unknown = contract;
		for (const key of route.path) {
			if (node === null || typeof node !== 'object' || !(key in node)) throw new Error('Invalid API contract path');
			node = Reflect.get(node, key);
		}
		if (!isContractProcedure(node)) throw new Error('Missing API procedure');
		const meta: ApiProcedureMetadata = node['~orpc'].meta;
		// Auth issuance/session management remains outside the scoped MCP boundary.
		// This boundary uses contract ownership and native policy, not a parallel endpoint whitelist.
		const mcpSupported = route.path[0] !== 'auth' && route.path[0] !== 'integrations' && !route.multipart && !route.ignoreBody
			&& !((meta.requireCredential || meta.requireAdmin || meta.requireModerator) && !meta.kind) && !meta.secure;
		return { name: route.name, policy: { ...meta, name: route.name }, mcpSupported };
	});
}

export async function authorizedEndpoints<Actor extends ApiActor>(descriptors: readonly ApiEndpointDescriptor[], context: AuthenticatedContext<Actor>) {
	const result: ApiEndpointDescriptor[] = [];
	for (const descriptor of descriptors) {
		try { await assertApiAuthorization(descriptor.policy, context); result.push(descriptor); } catch (error) {
			if (!(error instanceof ORPCError) || (error.status !== 401 && error.status !== 403 && error.code !== 'ACCESS_DENIED')) throw error;
		}
	}
	return result;
}
