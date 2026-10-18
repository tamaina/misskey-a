/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { performance } from 'node:perf_hooks';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { EntityManager } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiOidcProvider } from '../../backend/models/OidcProvider.js';
import { MiOidcIdentity } from '../../backend/models/OidcIdentity.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { OidcRuntime } from '../../backend/oidc-runtime.js';
import type { OidcRuntimeDependencies } from '../../backend/oidc-runtime.js';
import { OidcFlowStore, oidcHash } from '../../backend/oidc-flow-store.js';
import type { OidcFlow } from '../../backend/oidc-flow-store.js';
import { OidcTransactionStore } from '../../backend/oidc-transaction-store.js';
import { signinPolicyStamp } from '../../backend/signin-assurance.js';
import { oidcAddress } from '../../backend/oidc-network-policy.js';

const issuer = 'https://synthetic-idp.example';
const state = 's'.repeat(43); const secret = 'b'.repeat(43);
const metadata = { issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/keys` };
const exchange = vi.hoisted(() => vi.fn());
vi.mock('../../backend/oidc-discovery.js', () => ({ createOidcDiscovery: () => async () => metadata }));
vi.mock('../../backend/oidc-token-exchange.js', () => ({ createOidcTokenExchange: () => exchange }));
afterEach(() => vi.restoreAllMocks());

function fixture() {
	exchange.mockReset();
	const deps = mockDeep<OidcRuntimeDependencies>();
	Object.assign(deps.config, { url: 'https://synthetic.example', allowedPrivateNetworks: [] });
	Object.assign(deps.meta, { rootUserId: 'owner', disableRegistration: false, termsOfServiceUrl: null, serverRules: [] });
	const user = mockDeep<MiUser>({ id: 'owner', host: null, token: 'native', isSuspended: false, isDeleted: false });
	const profile = mockDeep<MiUserProfile>({ userId: user.id, password: 'synthetic-hash', twoFactorEnabled: false, passkeyMfaEnabled: false, usePasswordLessLogin: false, twoFactorSecret: null });
	const provider = mockDeep<MiOidcProvider>({ id: 'provider', name: 'Synthetic', issuer, clientId: 'client', clientSecret: 'synthetic-secret', version: 'v'.repeat(43), enabled: true });
	const providers = mockDeep<ReturnType<EntityManager['getRepository']>>(); providers.findOne.mockResolvedValue(provider); providers.findOneOrFail.mockResolvedValue(provider); providers.find.mockResolvedValue([provider]);
	const users = mockDeep<ReturnType<EntityManager['getRepository']>>(); users.findOneByOrFail.mockResolvedValue(user);
	const profiles = mockDeep<ReturnType<EntityManager['getRepository']>>(); profiles.findOneByOrFail.mockResolvedValue(profile);
	const identities = mockDeep<ReturnType<EntityManager['getRepository']>>(); identities.findOneBy.mockResolvedValue(null); identities.delete.mockResolvedValue({ affected: 1, raw: [] });
	const keys = mockDeep<ReturnType<EntityManager['getRepository']>>(); keys.findBy.mockResolvedValue([]);
	const sessions = mockDeep<ReturnType<EntityManager['getRepository']>>();
	const manager = mockDeep<EntityManager>();
	const repository = (entity: unknown) => {
		if (entity === MiUser) return users;
		if (entity === MiUserProfile) return profiles;
		if (entity === MiOidcProvider) return providers;
		if (entity === MiOidcIdentity) return identities;
		if (entity === MiUserSecurityKey) return keys;
		if (entity === MiBrowserSession) return sessions;
		throw new Error('Unexpected synthetic repository');
	};
	deps.db.getRepository.mockImplementation(repository); manager.getRepository.mockImplementation(repository);
	deps.local.transaction.mockImplementation(async (identity, run) => { expect(identity.browserSession.userId).toBe(user.id); return run({ manager, user, profile, keys: [], session: mockDeep<MiBrowserSession>() }); });
	deps.sessions.isActive.mockResolvedValue(true); deps.idService.gen.mockReturnValue('generated');
	const local = { userId: user.id, browserSession: { id: 'session', userId: user.id } };
	const transaction = { providerId: provider.id, providerVersion: provider.version, issuer, clientId: provider.clientId, purpose: { mode: 'login' as const }, nonce: 'nonce', codeVerifier: 'p'.repeat(43), redirectUri: 'https://synthetic.example/auth/oidc/callback/provider', codeChallenge: 'challenge' };
	vi.spyOn(OidcTransactionStore.prototype, 'lookup').mockResolvedValue(transaction);
	vi.spyOn(OidcTransactionStore.prototype, 'consume').mockResolvedValue(transaction);
	vi.spyOn(OidcTransactionStore.prototype, 'create').mockResolvedValue({ state, browserSecret: secret, nonce: 'nonce', codeChallenge: 'challenge', codeChallengeMethod: 'S256' });
	const create = vi.spyOn(OidcFlowStore.prototype, 'create').mockResolvedValue(state);
	exchange.mockResolvedValue({ issuer, subject: 'subject', verifiedEmail: 'same@example.test' });
	const flow: OidcFlow = { providerId: provider.id, providerVersion: provider.version, issuer, subject: 'subject', purpose: { mode: 'login' }, userId: user.id, identityId: 'syntheticidentity', policyStamp: signinPolicyStamp(user, profile, []) };
	vi.spyOn(OidcFlowStore.prototype, 'read').mockResolvedValue({ flow, version: 0 });
	const consume = vi.spyOn(OidcFlowStore.prototype, 'consume').mockResolvedValue({ flow, remainingMs: 90_000 });
	const runtime = new OidcRuntime(deps);
	return { deps, runtime, provider, providers, identities, user, profile, profiles, keys, local, flow, consume, create, transaction };
}

test('provider responses never serialize secrets; draft creation uses local authorization and starts disabled', async () => {
	const f = fixture();
	expect(JSON.stringify(await f.runtime.listProviders(true))).not.toContain('synthetic-secret');
	expect(await f.runtime.listProviders()).toEqual([{ id: 'provider', name: 'Synthetic' }]);
	expect(await f.runtime.createProvider(f.local, 'New')).toEqual({ id: 'generated', redirectUri: 'https://synthetic.example/auth/oidc/callback/generated' });
	expect(f.providers.insert).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, clientSecret: null, issuer: '', clientId: '' }));
	expect(f.deps.local.transaction).toHaveBeenCalledOnce();
});
test('authorization binds server redirect, client, state, nonce and S256 without a client-selected callback', async () => {
	const f = fixture(); const result = await f.runtime.begin('provider'); const url = new URL(result.url);
	expect(url.origin).toBe(issuer); expect(url.searchParams.get('redirect_uri')).toBe(f.transaction.redirectUri); expect(url.searchParams.get('client_id')).toBe('client'); expect(url.searchParams.get('state')).toBe(state); expect(url.searchParams.get('code_challenge_method')).toBe('S256');
	expect(OidcTransactionStore.prototype.create).toHaveBeenCalledWith(f.provider, { mode: 'login' }, f.transaction.redirectUri);
});
test('equal email never finds or links a local account; a new subject goes to onboarding', async () => {
	const f = fixture(); const result = await f.runtime.callback('provider', state, secret, 'code');
	expect(result).toMatchObject({ ticket: state, next: 'onboarding' });
	expect(f.identities.findOneBy).toHaveBeenCalledExactlyOnceWith({ issuer, subject: 'subject', providerId: 'provider' });
	expect(f.identities.insert).not.toHaveBeenCalled(); expect(f.deps.signin.signin).not.toHaveBeenCalled();
	expect(f.create).toHaveBeenCalledWith(expect.not.objectContaining({ userId: expect.anything() }), secret, state);
});
test('provider denial consumes only the bound transaction and creates no continuation', async () => {
	const f = fixture(); expect(await f.runtime.callback('provider', state, secret)).toEqual({ canceled: true }); expect(exchange).not.toHaveBeenCalled(); expect(f.create).not.toHaveBeenCalled();
});
test('linked identity still captures local policy and never issues a session at callback', async () => {
	const f = fixture(); f.identities.findOneBy.mockResolvedValue({ id: 'syntheticidentity', userId: f.user.id });
	expect(await f.runtime.callback('provider', state, secret, 'code')).toMatchObject({ next: 'login', factors: [] });
	expect(f.deps.signin.signin).not.toHaveBeenCalled(); expect(f.create).toHaveBeenCalledWith(expect.objectContaining({ userId: f.user.id, policyStamp: f.flow.policyStamp }), secret, state);
});
test.each(['provider', 'policy', 'no-factor'] as const)('%s change cannot authorize linked login', async mode => {
	const f = fixture(); if (mode === 'provider') f.provider.version = 'new'; if (mode === 'policy') f.profile.password = 'changed'; if (mode === 'no-factor') { f.profile.passkeyMfaEnabled = true; f.flow.policyStamp = signinPolicyStamp(f.user, f.profile, []); }
	await expect(f.runtime.login(state, secret, { ip: '127.0.0.1', headers: {} }, { code: vi.fn(), header: vi.fn() })).rejects.toThrow(); expect(f.deps.signin.signin).not.toHaveBeenCalled();
});
test('local TOTP is verified only after the one-use external continuation is consumed', async () => {
	const f = fixture(); f.profile.twoFactorEnabled = true; f.profile.twoFactorSecret = 'secret'; f.flow.policyStamp = signinPolicyStamp(f.user, f.profile, []);
	await f.runtime.login(state, secret, { ip: '127.0.0.1', headers: {} }, { code: vi.fn(), header: vi.fn() }, '123456');
	expect(f.consume.mock.invocationCallOrder[0]).toBeLessThan(f.deps.totp.twoFactorAuthenticate.mock.invocationCallOrder[0]);
	expect(f.deps.signin.signin).toHaveBeenCalledWith(expect.anything(), expect.anything(), f.user, expect.objectContaining({ mode: 'oidc', passwordVerified: false, factor: 'totp', external: { identityId: 'syntheticidentity', providerId: 'provider', providerVersion: f.provider.version, issuer, subject: 'subject' } }));
});
test.each(['consent', 'owner', 'session', 'expired'] as const)('link %s mismatch has no mutation', async mode => {
	const f = fixture(); f.flow.purpose = { mode: 'link', localUserId: f.user.id, localSessionId: 'session' };
	if (mode === 'owner') f.flow.purpose.localUserId = 'other'; if (mode === 'session') f.flow.purpose.localSessionId = 'other'; if (mode === 'expired') f.consume.mockResolvedValue({ flow: f.flow, remainingMs: 0 });
	await expect(f.runtime.link(state, secret, f.local, mode !== 'consent')).rejects.toThrow(); expect(f.identities.insert).not.toHaveBeenCalled();
});
test('explicit link rechecks provider under local sudo and binds only the verified subject', async () => {
	const f = fixture(); f.flow.purpose = { mode: 'link', localUserId: f.user.id, localSessionId: 'session' };
	await f.runtime.link(state, secret, f.local, true);
	expect(f.deps.local.transaction).toHaveBeenCalledOnce(); expect(f.identities.insert).toHaveBeenCalledExactlyOnceWith({ id: 'generated', userId: f.user.id, providerId: 'provider', issuer, subject: 'subject', createdAt: expect.any(Date) });
});
test('unlink keeps a local login method and scopes deletion to the authenticated owner', async () => {
	const f = fixture(); await f.runtime.unlink('identity', f.local); expect(f.identities.delete).toHaveBeenCalledWith({ id: 'identity', userId: 'owner' });
	f.identities.delete.mockClear(); f.profile.password = null; await expect(f.runtime.unlink('identity', f.local)).rejects.toThrow(); expect(f.identities.delete).not.toHaveBeenCalled();
});
test('expiration during a locked link write throws so the transaction rolls back', async () => {
	const f = fixture(); f.flow.purpose = { mode: 'link', localUserId: f.user.id, localSessionId: 'session' };
	const original = performance.now(); f.consume.mockResolvedValue({ flow: f.flow, remainingMs: 1000 });
	f.identities.insert.mockImplementation(async () => { vi.spyOn(performance, 'now').mockReturnValue(original + 5000); return { identifiers: [], generatedMaps: [], raw: [] }; });
	await expect(f.runtime.link(state, secret, f.local, true)).rejects.toThrow('expired');
});
test('email proof must match before a continuation can be consumed', async () => {
	const f = fixture(); const read = vi.spyOn(OidcFlowStore.prototype, 'read').mockResolvedValue({ version: 1, flow: { ...f.flow, userId: undefined, registration: { username: 'new', email: 'new@example.test', passwordHash: 'hash', termsStamp: 'terms', codeHash: oidcHash('a'.repeat(32)) } } });
	await expect(f.runtime.finishRegistration(state, secret, 'b'.repeat(32))).rejects.toThrow('verification'); expect(read).toHaveBeenCalledOnce(); expect(f.consume).not.toHaveBeenCalled(); expect(f.deps.signup.signup).not.toHaveBeenCalled();
});
test('network exception is opt-in, CIDR-bounded, normalized and still rejects transition/zone bypasses', () => {
	expect(() => oidcAddress('127.0.0.1', [])).toThrow(); expect(oidcAddress('10.2.3.4', ['10.2.0.0/16'])).toBe('10.2.3.4'); expect(() => oidcAddress('10.3.3.4', ['10.2.0.0/16'])).toThrow(); expect(() => oidcAddress('fe80::1%lo', ['fe80::/10'])).toThrow();
});

test('explicit secret erasure requires an already disabled unlinked current provider', async () => {
	const f = fixture(); const input = { id: f.provider.id, version: f.provider.version, name: 'Synthetic', issuer, clientId: 'client', enabled: false, clearClientSecret: true as const };
	await expect(f.runtime.updateProvider(f.local, input)).rejects.toThrow('Disable provider'); expect(f.providers.update).not.toHaveBeenCalled();
	f.provider.enabled = false; f.identities.existsBy.mockResolvedValueOnce(true);
	await expect(f.runtime.updateProvider(f.local, input)).rejects.toThrow('Disable provider');
	await expect(f.runtime.updateProvider(f.local, { ...input, clientSecret: 'replacement' })).rejects.toThrow('Disable provider');
	await expect(f.runtime.updateProvider(f.local, { ...input, version: 'x'.repeat(43) })).rejects.toThrow('settings changed');
	await f.runtime.updateProvider(f.local, input);
	expect(f.providers.update).toHaveBeenCalledWith({ id: f.provider.id }, expect.objectContaining({ clientSecret: null, enabled: false, version: expect.not.stringMatching(f.provider.version) }));
});
test('blank secret omission preserves the existing value rather than silently clearing it', async () => {
	const f = fixture(); await f.runtime.updateProvider(f.local, { id: f.provider.id, version: f.provider.version, name: 'Synthetic', issuer, clientId: 'client', enabled: false });
	expect(f.providers.update).toHaveBeenCalledWith({ id: f.provider.id }, expect.objectContaining({ clientSecret: 'synthetic-secret' }));
});
