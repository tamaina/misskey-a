/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createOidcRouter } from '../../backend/oidc-api.js';
import { oidcContract } from '../../backend/oidc.contract.js';
import type { OidcRuntime } from '../../backend/oidc-runtime.js';
import { testContext } from './native-context.js';

const ticket = 't'.repeat(43); const secret = 'b'.repeat(43);

function fixture(signedIn = false) {
	const actor = mockDeep<MiLocalUser>({ id: 'synthetic', isSuspended: false, movedToUri: null });
	const context = testContext(signedIn ? actor : null);
	if (signedIn) context.services.authenticate = async () => [actor, null, { id: 'session', userId: actor.id }];
	context.headers = { origin: 'https://synthetic.example', cookie: `__Host-mk-oidc-${ticket}=${secret}` }; context.response = { header: vi.fn() };
	const runtime = mockDeep<OidcRuntime>(); const router = createOidcRouter(runtime, 'https://synthetic.example');
	return { actor, context, runtime, router };
}

const publicRoutes = ['oidc/providers', 'oidc/start', 'oidc/callback', 'oidc/status', 'oidc/cancel', 'oidc/login', 'oidc/onboarding', 'oidc/onboarding/verify'] as const;
const protectedRoutes = ['i/oidc/links', 'i/oidc/link/start', 'i/oidc/link/complete', 'i/oidc/unlink', 'admin/oidc/providers', 'admin/oidc/create', 'admin/oidc/update'] as const;
test('anonymous login routes and protected local/admin routes retain exact native policy', () => {
	expect(Object.keys(oidcContract)).toHaveLength(15);
	expect([...publicRoutes, ...protectedRoutes].sort()).toEqual(Object.keys(oidcContract).sort());
	for (const name of publicRoutes) expect(oidcContract[name]['~orpc'].meta).toMatchObject({ requestName: name, secure: false });
	for (const name of protectedRoutes) expect(oidcContract[name]['~orpc'].meta).toMatchObject({ requestName: name, secure: true, requireCredential: true });
	for (const name of ['admin/oidc/create', 'admin/oidc/update', 'admin/oidc/providers'] as const) expect(oidcContract[name]['~orpc'].meta).toMatchObject({ requireAdmin: true });
});
test('anonymous status, cancel, login and onboarding reach only their browser-bound runtime operations', async () => {
	const f = fixture(); const flow = { next: 'onboarding' as const, emailSent: false, termsUrl: null };
	f.runtime.listProviders.mockResolvedValue([]); f.runtime.status.mockResolvedValue(flow);
	const signedIn = { finished: true as const, id: 'newowner', i: 'bs_synthetic' }; f.runtime.login.mockResolvedValue(signedIn); f.runtime.finishRegistration.mockResolvedValue(signedIn);
	expect(await call(f.router['oidc/providers'], {}, { context: f.context })).toEqual([]);
	expect(await call(f.router['oidc/status'], { ticket }, { context: f.context })).toEqual(flow);
	await call(f.router['oidc/cancel'], { ticket }, { context: f.context }); expect(f.runtime.cancel).toHaveBeenCalledExactlyOnceWith(ticket, secret);
	expect(await call(f.router['oidc/login'], { ticket }, { context: f.context })).toEqual(signedIn);
	await call(f.router['oidc/onboarding'], { ticket, username: 'syntheticnew', password: 'synthetic-password', email: 'new@example.test', agree: true }, { context: f.context });
	expect(f.runtime.register).toHaveBeenCalledWith(ticket, secret, expect.objectContaining({ username: 'syntheticnew' }));
	expect(await call(f.router['oidc/onboarding/verify'], { ticket, code: 'a'.repeat(32) }, { context: f.context })).toEqual(signedIn);
	expect(f.runtime.status).toHaveBeenCalledExactlyOnceWith(ticket, secret); expect(f.runtime.finishRegistration).toHaveBeenCalledExactlyOnceWith(ticket, secret, 'a'.repeat(32));
});
test.each(protectedRoutes)('%s rejects anonymous and delegated credentials before invalid input', async name => {
	for (const delegated of [false, true]) {
		const f = fixture(delegated); if (delegated) f.context.services.authenticate = async () => [f.actor, { permission: ['write:account'] }];
		const invoke = {
			'i/oidc/links': () => call(f.router['i/oidc/links'], {}, { context: f.context }),
			'i/oidc/link/start': () => call(f.router['i/oidc/link/start'], { providerId: '' }, { context: f.context }),
			'i/oidc/link/complete': () => call(f.router['i/oidc/link/complete'], { ticket: '', agree: true }, { context: f.context }),
			'i/oidc/unlink': () => call(f.router['i/oidc/unlink'], { id: '' }, { context: f.context }),
			'admin/oidc/providers': () => call(f.router['admin/oidc/providers'], {}, { context: f.context }),
			'admin/oidc/create': () => call(f.router['admin/oidc/create'], { name: '' }, { context: f.context }),
			'admin/oidc/update': () => call(f.router['admin/oidc/update'], { id: '', version: '', name: '', issuer: '', clientId: '', enabled: false }, { context: f.context }),
		};
		await expect(invoke[name]()).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
		expect(f.runtime.begin).not.toHaveBeenCalled(); expect(f.runtime.link).not.toHaveBeenCalled(); expect(f.runtime.unlink).not.toHaveBeenCalled(); expect(f.runtime.listProviders).not.toHaveBeenCalled(); expect(f.runtime.links).not.toHaveBeenCalled(); expect(f.runtime.createProvider).not.toHaveBeenCalled(); expect(f.runtime.updateProvider).not.toHaveBeenCalled();
	}
});
test('an ordinary local session cannot enter administrator provider settings', async () => {
	const f = fixture(true); f.context.authorization!.rootUserId = () => 'anotherroot';
	await expect(call(f.router['admin/oidc/providers'], {}, { context: f.context })).rejects.toMatchObject({ code: 'ROLE_PERMISSION_DENIED' }); expect(f.runtime.listProviders).not.toHaveBeenCalled();
});
test('start sends a host-only secure HttpOnly cookie without exposing the browser secret', async () => {
	const f = fixture(); f.runtime.begin.mockResolvedValue({ url: 'https://idp.example/authorize', state: ticket, browserSecret: secret });
	expect(await call(f.router['oidc/start'], { providerId: 'provider' }, { context: f.context })).toEqual({ url: 'https://idp.example/authorize' });
	expect(f.context.response!.header).toHaveBeenCalledWith('Set-Cookie', `__Host-mk-oidc-${ticket}=${secret}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=300`);
});
test.each(['missing-origin', 'foreign-origin', 'missing-cookie', 'duplicate-cookie'] as const)('%s cannot enter a browser-bound callback', async scenario => {
	const f = fixture(); if (scenario === 'missing-origin') delete f.context.headers.origin; if (scenario === 'foreign-origin') f.context.headers.origin = 'https://other.example'; if (scenario === 'missing-cookie') delete f.context.headers.cookie; if (scenario === 'duplicate-cookie') f.context.headers.cookie += `; __Host-mk-oidc-${ticket}=${secret}`;
	await expect(call(f.router['oidc/callback'], { providerId: 'provider', state: ticket, code: 'code' }, { context: f.context })).rejects.toMatchObject({ code: 'OIDC_FAILED' }); expect(f.runtime.callback).not.toHaveBeenCalled();
});
test.each(['oidc/status', 'oidc/cancel', 'oidc/login'] as const)('%s still requires exact Origin and its browser cookie while anonymous', async name => {
	for (const missing of ['origin', 'cookie'] as const) {
		const f = fixture(); delete f.context.headers[missing];
		const invoke = {
			'oidc/status': () => call(f.router['oidc/status'], { ticket }, { context: f.context }),
			'oidc/cancel': () => call(f.router['oidc/cancel'], { ticket }, { context: f.context }),
			'oidc/login': () => call(f.router['oidc/login'], { ticket }, { context: f.context }),
		};
		await expect(invoke[name]()).rejects.toMatchObject({ code: 'OIDC_FAILED' });
		expect(f.runtime.status).not.toHaveBeenCalled(); expect(f.runtime.cancel).not.toHaveBeenCalled(); expect(f.runtime.login).not.toHaveBeenCalled();
	}
});
test('callback binds the cookie and returns a continuation only, never a session or IdP token', async () => {
	const f = fixture(); f.runtime.callback.mockResolvedValue({ ticket, next: 'login', factors: [] });
	expect(await call(f.router['oidc/callback'], { providerId: 'provider', state: ticket, code: 'code' }, { context: f.context })).toEqual({ ticket, flow: { next: 'login', factors: [] } });
	expect(f.runtime.callback).toHaveBeenCalledExactlyOnceWith('provider', ticket, secret, 'code'); expect(f.runtime.login).not.toHaveBeenCalled();
});
test('denial clears the transaction cookie and does not invent a local grant', async () => {
	const f = fixture(); f.runtime.callback.mockResolvedValue({ canceled: true });
	expect(await call(f.router['oidc/callback'], { providerId: 'provider', state: ticket }, { context: f.context })).toEqual({ canceled: true });
	expect(f.context.response!.header).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('Max-Age=0'));
});
test.each(['native', 'oauth', 'wrong-owner'] as const)('%s cannot establish local link authority', async mode => {
	const f = fixture(true);
	if (mode === 'native') f.context.services.authenticate = async () => [f.actor, null];
	if (mode === 'oauth') f.context.services.authenticate = async () => [f.actor, { permission: ['write:account'] }];
	if (mode === 'wrong-owner') f.context.services.authenticate = async () => [f.actor, null, { id: 'session', userId: 'other' }];
	await expect(call(f.router['i/oidc/link/start'], { providerId: 'provider' }, { context: f.context })).rejects.toThrow(); expect(f.runtime.begin).not.toHaveBeenCalled();
});
test('link uses only server-authenticated owner/session and explicit consent', async () => {
	const f = fixture(true); await call(f.router['i/oidc/link/complete'], { ticket, agree: true }, { context: f.context });
	expect(f.runtime.link).toHaveBeenCalledExactlyOnceWith(ticket, secret, { userId: f.actor.id, browserSession: { id: 'session', userId: f.actor.id }, accessToken: null }, true);
});
