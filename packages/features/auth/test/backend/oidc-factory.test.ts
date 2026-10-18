/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import type { ModuleRef } from '@nestjs/core';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DI } from '@/di-symbols.js';
import { AuthApiProvider } from '../../backend/api.implementation.js';
import type { OidcLocalAuthorization } from '../../backend/oidc-runtime.js';
import { testContext } from './native-context.js';

test('actual native provider delegates OIDC administration to the shared sudo alias and authenticated session', async () => {
	const moduleRef = mockDeep<ModuleRef>(); const sudo = mockDeep<OidcLocalAuthorization>();
	const actor = mockDeep<MiLocalUser>({ id: 'syntheticowner', isSuspended: false, movedToUri: null });
	moduleRef.get.mockImplementation(token => {
		if (token === 'auth:SudoService') return sudo;
		if (token === DI.config) return { url: 'https://synthetic.example', allowedPrivateNetworks: [] };
		if (token === undefined) throw new Error('Undefined DI token');
		return mockDeep();
	});
	sudo.transaction.mockResolvedValue({ id: 'syntheticprovider', redirectUri: 'https://synthetic.example/auth/oidc/callback/syntheticprovider' });
	const provider = new AuthApiProvider(moduleRef); const router = provider.compose(); expect(provider.compose()).toBe(router);
	const context = testContext(actor); context.services.authenticate = async () => [actor, null, { id: 'syntheticsession', userId: actor.id }];
	context.headers.origin = 'https://synthetic.example'; context.response = { header: vi.fn() };
	expect(await call(router['admin/oidc/create'], { name: 'Synthetic' }, { context })).toMatchObject({ id: 'syntheticprovider' });
	expect(moduleRef.get.mock.calls.filter(([token]) => token === 'auth:SudoService')).toHaveLength(1);
	expect(sudo.transaction).toHaveBeenCalledExactlyOnceWith({ userId: actor.id, browserSession: { id: 'syntheticsession', userId: actor.id }, accessToken: null }, expect.any(Function));
});
