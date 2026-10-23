/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it, vi } from 'vitest';
import { authorizedEndpoints } from '../../backend/transport/endpoint-directory.js';
import type { ApiEndpointDescriptor } from '../../backend/transport/endpoint-directory.js';
import type { AuthenticatedContext, ApiPolicy } from '../../backend/transport/middleware.js';
import type { ApiActor } from '../../backend/transport/context.js';

it('uses native secure, kindless, scope, account and role rules without consuming rate limits', async () => {
	const principal: ApiActor = { id: 'user', isSuspended: false, movedToUri: null };
	const context: AuthenticatedContext<ApiActor> = {
		principal, token: { id: 'token', permission: ['read:account'] }, credential: 'synthetic', ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [principal, null], limitActor: () => principal.id, rateLimitFactor: async () => 1, limit: vi.fn() },
		authorization: { rootUserId: () => null, roles: async () => [], policyAllowed: async () => false },
	};
	const policies: ApiPolicy[] = [
		{ name: 'public', requireCredential: false }, { name: 'secure', secure: true },
		{ name: 'kindless', requireCredential: true }, { name: 'read', requireCredential: true, kind: 'read:account', prohibitMoved: true },
		{ name: 'write', requireCredential: true, kind: 'write:notes' }, { name: 'admin', requireAdmin: true, kind: 'read:account' },
		{ name: 'role', kind: 'read:account', requiredRolePolicy: 'canInvite' },
	];
	const descriptors: ApiEndpointDescriptor[] = policies.map(policy => ({ name: policy.name, policy, inputSchema: {}, mcpSupported: true }));
	expect((await authorizedEndpoints(descriptors, context)).map(endpoint => endpoint.name)).toEqual(['public', 'read']);
	expect(context.services.limit).not.toHaveBeenCalled();
	principal.isSuspended = true; expect((await authorizedEndpoints(descriptors, context)).map(endpoint => endpoint.name)).toEqual(['public']);
	principal.isSuspended = false; principal.movedToUri = 'https://elsewhere.invalid';
	expect((await authorizedEndpoints(descriptors, context)).map(endpoint => endpoint.name)).toEqual(['public']);
});
