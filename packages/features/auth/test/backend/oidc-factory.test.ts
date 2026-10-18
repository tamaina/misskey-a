/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { call } from '@orpc/server';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import type { FactoryProvider, InjectionToken } from '@nestjs/common';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DI } from '@/di-symbols.js';
import { AuthApiProvider } from '../../backend/api.implementation.js';
import { SudoService } from '../../backend/sudo.js';
import { OAuth2ProviderService } from '../../backend/oauth/OAuth2ProviderService.js';
import { authSecurityServices } from '../../backend/services.js';
import { featureServiceExports, featureServiceGroups } from '../../../index/backend/feature-service-providers.js';
import type { Inputs } from '../../../index/backend/service-definitions.js';
import type { OidcLocalAuthorization } from '../../backend/oidc-runtime.js';
import { testContext } from './native-context.js';
import { UsersApiProvider } from '../../../users/backend/api.implementation.js';

test('actual native provider delegates OIDC administration to the canonical shared sudo and authenticated session', async () => {
	const moduleRef = mockDeep<ModuleRef>(); const sudo = mockDeep<OidcLocalAuthorization>();
	const actor = mockDeep<MiLocalUser>({ id: 'syntheticowner', isSuspended: false, movedToUri: null });
	moduleRef.get.mockImplementation(token => {
		if (token === SudoService) return sudo;
		if (token === DI.config) return { url: 'https://synthetic.example', allowedPrivateNetworks: [] };
		if (token === undefined) throw new Error('Undefined DI token');
		return mockDeep();
	});
	sudo.transaction.mockResolvedValue({ id: 'syntheticprovider', redirectUri: 'https://synthetic.example/auth/oidc/callback/syntheticprovider' });
	const provider = new AuthApiProvider(moduleRef); const router = provider.compose(); expect(provider.compose()).toBe(router);
	const context = testContext(actor); context.services.authenticate = async () => [actor, null, { id: 'syntheticsession', userId: actor.id }];
	context.headers.origin = 'https://synthetic.example'; context.response = { header: vi.fn() };
	expect(await call(router['admin/oidc/create'], { name: 'Synthetic' }, { context })).toMatchObject({ id: 'syntheticprovider' });
	expect(moduleRef.get.mock.calls.filter(([token]) => token === SudoService)).toHaveLength(3);
	expect(sudo.transaction).toHaveBeenCalledExactlyOnceWith({ userId: actor.id, browserSession: { id: 'syntheticsession', userId: actor.id }, accessToken: null }, expect.any(Function));
});

test('OAuth resolves the actual shared security graph across a Nest module export boundary', async () => {
	const group = featureServiceGroups.authSecurity;
	const factory = group.providers.find((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
	if (!factory) throw new Error('Missing security graph factory');
	expect(featureServiceExports).toContain(SudoService);
	expect(factory.inject).toHaveLength(authSecurityServices.ports.length);
	const inputs = mockDeep<Inputs<typeof authSecurityServices>>();
	const portProviders = (factory.inject ?? []).map((dependency, index) => ({
		provide: typeof dependency === 'object' ? dependency.token : dependency,
		useValue: inputs[authSecurityServices.ports[index].name as keyof Inputs<typeof authSecurityServices>],
	}));
	class SecurityCoreFixture {}
	Module({ providers: [...portProviders, ...group.providers], exports: group.exports })(SecurityCoreFixture);

	const tokens = [...Reflect.getMetadata('design:paramtypes', OAuth2ProviderService)] as InjectionToken[];
	// Nest's explicit @Inject overrides supplement emitted constructor types.
	const explicit = Reflect.getMetadata('self:paramtypes', OAuth2ProviderService) as { index: number; param: InjectionToken }[];
	for (const { index, param } of explicit) tokens[index] = param;
	expect(tokens.at(-1)).toBe(SudoService);
	class OAuthServerFixture {}
	Module({
		imports: [SecurityCoreFixture],
		providers: [OAuth2ProviderService, ...tokens.slice(0, -1).map(provide => ({ provide, useValue: mockDeep() }))],
	})(OAuthServerFixture);
	const module = await Test.createTestingModule({ imports: [OAuthServerFixture] }).compile();
	try {
		const sudo = module.get(SudoService);
		expect(sudo).toBeInstanceOf(SudoService);
		expect(module.get('SudoService')).toBe(sudo);
		expect(Reflect.get(module.get(OAuth2ProviderService), 'local')).toBe(sudo);
	} finally { await module.close(); }
});

test('account deletion composes with database and meta exported by a different Nest module', async () => {
	const db = { fixture: 'database' }; const meta = { fixture: 'meta' };
	class GlobalDependenciesFixture {}
	Module({ providers: [{ provide: DI.db, useValue: db }, { provide: DI.meta, useValue: meta }], exports: [DI.db, DI.meta] })(GlobalDependenciesFixture);
	class UsersApiFixture {}
	Module({ imports: [GlobalDependenciesFixture], providers: [UsersApiProvider] })(UsersApiFixture);
	const module = await Test.createTestingModule({ imports: [UsersApiFixture] }).compile();
	const ref = module.select(UsersApiFixture).get(ModuleRef, { strict: true });
	const get = ref.get.bind(ref);
	// Imported providers require non-strict lookup even when they are exported.
	expect(() => get(DI.db)).toThrow(); expect(() => get(DI.meta)).toThrow();
	expect(get(DI.db, { strict: false })).toBe(db); expect(get(DI.meta, { strict: false })).toBe(meta);
	const lookup = vi.spyOn(ref, 'get').mockImplementation((token, options) => token === DI.db || token === DI.meta ? get(token, options) : mockDeep());
	try {
		const provider = module.get(UsersApiProvider);
		const router = provider.compose();
		expect(router['i/delete-account']).toBeDefined();
		expect(provider.compose()).toBe(router);
		expect(lookup).toHaveBeenCalledWith(DI.db, expect.objectContaining({ strict: false }));
		expect(lookup).toHaveBeenCalledWith(DI.meta, expect.objectContaining({ strict: false }));
	} finally { lookup.mockRestore(); await module.close(); }
});
