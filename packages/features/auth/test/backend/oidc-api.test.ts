/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createOidcRouter } from '../../backend/oidc-api.js';
import { oidcContract } from '../../backend/oidc-contract.js';
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
test('all OIDC routes retain secure policy and finite, explicit native names', () => {
	expect(Object.keys(oidcContract)).toHaveLength(15);
	for (const [name, contract] of Object.entries(oidcContract)) expect(contract['~orpc'].meta).toMatchObject({ requestName: name, secure: true });
	for (const name of ['admin/oidc/create', 'admin/oidc/update', 'admin/oidc/providers'] as const) expect(oidcContract[name]['~orpc'].meta).toMatchObject({ requireCredential: true, requireAdmin: true });
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
