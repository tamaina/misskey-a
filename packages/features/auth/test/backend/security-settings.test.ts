/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { performance } from 'node:perf_hooks';
import { beforeEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { EntityManager, Repository } from 'typeorm';
import * as webauthn from '@simplewebauthn/server';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiPasswordResetRequest } from '../../backend/models/PasswordResetRequest.js';
import { SecuritySettings } from '../../backend/security-settings.js';
import type { SecuritySettingsDependencies } from '../../backend/security-settings.js';
import type { LockedSudoContext } from '../../backend/sudo.js';
import type { SecurityOperation } from '../../backend/security-operation-store.js';
import { SecurityConfirmationRejected } from '../../backend/security-operation-store.js';

vi.mock('@simplewebauthn/server', async original => ({ ...await original<typeof import('@simplewebauthn/server')>(), verifyAuthenticationResponse: vi.fn(), verifyRegistrationResponse: vi.fn() }));
const identity = { userId: 'synthetic-user', browserSession: { id: 'synthetic-session', userId: 'synthetic-user' } };
const credential = { id: 'AQID', rawId: 'AQID', type: 'public-key', response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID', userHandle: Buffer.from(identity.userId).toString('base64url') }, clientExtensionResults: {} };
const ticket = 'x'.repeat(43);

function fixture() {
	const deps = mockDeep<SecuritySettingsDependencies>();
	deps.config = { url: 'https://synthetic.example', host: 'synthetic.example', hostname: 'synthetic.example' }; deps.meta = { name: 'Synthetic', rootUserId: null };
	const manager = mockDeep<EntityManager>();
	const users = mockDeep<Repository<MiUser>>(); const profiles = mockDeep<Repository<MiUserProfile>>();
	const keys = mockDeep<Repository<MiUserSecurityKey>>(); const sessions = mockDeep<Repository<MiBrowserSession>>();
	const resets = mockDeep<Repository<MiPasswordResetRequest>>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUser) return users as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserSecurityKey) return keys as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiBrowserSession) return sessions as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiPasswordResetRequest) return resets as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('Unexpected repository');
	});
	const user = mockDeep<MiUser>({ id: identity.userId, token: 'synthetic-native', username: 'synthetic', name: null });
	const profile = mockDeep<MiUserProfile>({ userId: identity.userId, password: 'synthetic-hash', twoFactorEnabled: false, twoFactorSecret: null, twoFactorTempSecret: null,
		twoFactorBackupSecret: null, passkeyMfaEnabled: false, usePasswordLessLogin: false, passwordLoginDisabled: false, email: 'synthetic@example.test', emailVerified: true });
	const key = mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: identity.userId, publicKey: 'AQID', counter: 1, transports: ['usb'], name: 'Synthetic', lastUsed: new Date() });
	const context: LockedSudoContext = { manager, user, profile, keys: [key], session: mockDeep<MiBrowserSession>({ id: identity.browserSession.id, userId: identity.userId, sudoGrantId: 'g'.repeat(43), sudoUntil: new Date(Date.now() + 300_000) }) };
	const committed = vi.fn();
	deps.sudo.transaction.mockImplementation(async (_owner, run) => { const result = await run(context); committed(); return result; });
	deps.sudo.status.mockResolvedValue({ active: true, expiresAt: context.session.sudoUntil!.toISOString() });
	let pending: SecurityOperation | undefined;
	deps.operations.create.mockImplementation(async value => { pending = value; return ticket; });
	deps.operations.consume.mockImplementation(async (kind, userId, sessionId, value) => {
		if (!pending || pending.kind !== kind || pending.userId !== userId || pending.sessionId !== sessionId || value !== ticket) throw new Error('No matching pending confirmation');
		const row = pending; pending = undefined; return { ...row, expiresAtMonotonic: performance.now() + 90_000 };
	});
	sessions.find.mockResolvedValue([mockDeep<MiBrowserSession>({ id: 'other-session' })]);
	keys.update.mockResolvedValue({ affected: 1, generatedMaps: [], raw: [] });
	return { service: new SecuritySettings(deps), deps, context, user, profile, key, users, profiles, keys, sessions, committed, pending: () => pending };
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({ verified: true, authenticationInfo: { credentialID: 'AQID', newCounter: 2,
		userVerified: false, credentialDeviceType: 'singleDevice', credentialBackedUp: false, origin: 'https://synthetic.example', rpID: 'synthetic.example' } });
});

test('registration starts without TOTP and does not change policy before a verified credential', async () => {
	const f = fixture(); f.context.keys = [];
	const started = await f.service.registerStart(identity, 'New key');
	expect(started.options).toMatchObject({ authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' } });
	expect(f.pending()).toMatchObject({ kind: 'register-passkey', name: 'New key', userId: identity.userId, sessionId: identity.browserSession.id });
	expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.profile.passkeyMfaEnabled).toBe(false);
});

const registrationCredential = { id: 'AQID', rawId: 'AQID', type: 'public-key', response: { clientDataJSON: 'AQID', attestationObject: 'AQID', transports: ['usb'] }, clientExtensionResults: {} };

function acceptRegistration() {
	vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({ verified: true, registrationInfo: {
		credential: { id: 'AQID', publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['usb'] },
		credentialDeviceType: 'singleDevice', credentialBackedUp: false,
	} } as Awaited<ReturnType<typeof webauthn.verifyRegistrationResponse>>);
}

test.each([false, true])('registration immediately enables MFA with TOTP=%s and returns only newly issued recovery codes', async totp => {
	const f = fixture(); f.context.keys = []; f.profile.twoFactorEnabled = totp;
	f.profile.twoFactorSecret = totp ? 'synthetic-secret' : null;
	f.profile.twoFactorBackupSecret = totp ? ['unspent-code'] : null;
	f.keys.findBy.mockResolvedValue([f.key]); acceptRegistration();
	const started = await f.service.registerStart(identity, 'New key');
	const result = await f.service.registerComplete(identity, started.ticket, registrationCredential);
	expect(result).toMatchObject({ id: 'AQID', name: 'New key' });
	if (totp) expect(result.backupCodes).toEqual([]);
	else { expect(result.backupCodes).toHaveLength(5); expect(new Set(result.backupCodes).size).toBe(5); }
	expect(webauthn.verifyRegistrationResponse).toHaveBeenCalledWith(expect.objectContaining({ requireUserVerification: false, expectedChallenge: started.options.challenge }));
	expect(f.profiles.update).toHaveBeenCalledExactlyOnceWith({ userId: identity.userId }, { passkeyMfaEnabled: true, ...(totp ? {} : { twoFactorBackupSecret: result.backupCodes }) });
	expect(f.deps.events.publishInternalEvent).not.toHaveBeenCalled();
	expect(f.sessions.find).not.toHaveBeenCalled(); expect(f.sessions.update).toHaveBeenCalledOnce();
	expect(f.users.update).not.toHaveBeenCalled();
	expect(f.sessions.update).toHaveBeenCalledWith({ id: identity.browserSession.id, userId: identity.userId }, { sudoPolicyStamp: expect.stringMatching(/^[a-f0-9]{64}$/) });
	expect(f.sessions.update.mock.calls.every(([, patch]) => !('sudoUntil' in patch) || patch.sudoUntil === null)).toBe(true);
	expect(f.committed.mock.invocationCallOrder.at(-1)!).toBeLessThan(f.deps.events.publishMainStream.mock.invocationCallOrder[0]);
	await expect(f.service.registerComplete(identity, started.ticket, registrationCredential)).rejects.toThrow();
	expect(f.keys.insert).toHaveBeenCalledOnce();
});

test.each(['proof', 'policy', 'codes', 'grant', 'deadline'] as const)('registration rejects %s failure without saving a key or enabling MFA', async kind => {
	const f = fixture(); const started = await f.service.registerStart(identity, 'New key'); acceptRegistration();
	if (kind === 'proof') vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({ verified: false } as never);
	if (kind === 'policy') f.profile.password = 'changed';
	if (kind === 'codes') f.profile.twoFactorBackupSecret = ['changed'];
	if (kind === 'grant') f.context.session.sudoGrantId = 'h'.repeat(43);
	if (kind === 'deadline') f.context.session.sudoUntil = new Date(Date.now() + 5000);
	await expect(f.service.registerComplete(identity, started.ticket, registrationCredential)).rejects.toThrow();
	expect(f.keys.insert).not.toHaveBeenCalled(); expect(f.profiles.update).not.toHaveBeenCalled();
	expect(f.deps.events.publishMainStream).not.toHaveBeenCalled();
	await expect(f.service.registerComplete(identity, started.ticket, registrationCredential)).rejects.toThrow();
});

test.each([false, true])('registration can repeatedly add usable keys with passwordless and passwordLoginDisabled=%s', async disabled => {
	const f = fixture(); f.profile.usePasswordLessLogin = true; f.profile.passwordLoginDisabled = disabled;
	f.profile.twoFactorBackupSecret = ['keep']; acceptRegistration();
	for (const id of ['BAUG', 'BwgJ']) {
		const started = await f.service.registerStart(identity, id);
		expect(started.options.authenticatorSelection).toMatchObject({ residentKey: 'required', userVerification: 'required' });
		expect(started.options.excludeCredentials?.map(key => key.id)).toEqual(f.context.keys.map(key => key.id));
		const added = { ...f.key, id };
		f.keys.findBy.mockResolvedValue([...f.context.keys, added]);
		vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({ verified: true, registrationInfo: {
			credential: { id, publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['usb'] },
			credentialDeviceType: 'singleDevice', credentialBackedUp: false,
		} } as Awaited<ReturnType<typeof webauthn.verifyRegistrationResponse>>);
		const completed = await f.service.registerComplete(identity, started.ticket, { ...registrationCredential, id, rawId: id });
		expect(completed).toEqual({ id, name: id, backupCodes: [] });
		expect(webauthn.verifyRegistrationResponse).toHaveBeenLastCalledWith(expect.objectContaining({ requireUserVerification: true }));
		Object.assign(f.profile, f.profiles.update.mock.calls.at(-1)![1]); f.context.keys.push(added);
	}
	expect(f.profile).toMatchObject({ usePasswordLessLogin: true, passwordLoginDisabled: disabled, passkeyMfaEnabled: true });
	expect(f.keys.insert).toHaveBeenCalledTimes(2);
	expect(f.users.update).not.toHaveBeenCalled(); expect(f.sessions.find).not.toHaveBeenCalled();
	expect(f.sessions.update.mock.calls.every(([where, patch]) => 'id' in where && where.id === identity.browserSession.id && !('revokedAt' in patch))).toBe(true);
	expect(f.deps.events.publishInternalEvent).not.toHaveBeenCalled();
});

test('removing a key still revokes other browser sessions', async () => {
	const f = fixture(); f.context.keys.push({ ...f.key, id: 'BAUG' }); f.profile.passkeyMfaEnabled = true;
	await f.service.removeKey(identity, f.key.id);
	expect(f.keys.delete).toHaveBeenCalledWith({ id: f.key.id, userId: identity.userId });
	expect(f.sessions.update).toHaveBeenCalledWith(expect.objectContaining({ userId: identity.userId }), { revokedAt: expect.any(Date), sudoUntil: null, sudoPolicyStamp: null });
	expect(f.deps.events.publishInternalEvent).toHaveBeenCalledWith('browserSessionRevoked', { id: 'other-session', userId: identity.userId });
});

test('activation exposes codes for explicit acknowledgement before writing the policy', async () => {
	const f = fixture(); const started = await f.service.activateStart(identity);
	expect(started.backupCodes).toHaveLength(5); expect(new Set(started.backupCodes).size).toBe(5);
	expect(started.options.userVerification).toBe('preferred'); expect(f.profiles.update).not.toHaveBeenCalled();
	await expect(f.service.activateComplete(identity, ticket, credential, false)).rejects.toThrow();
	expect(f.deps.operations.consume).not.toHaveBeenCalled();
	await f.service.activateComplete(identity, ticket, credential, true);
	expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledWith(expect.objectContaining({ requireUserVerification: false, expectedChallenge: started.options.challenge }));
	expect(f.deps.events.publishInternalEvent).toHaveBeenCalledWith('browserSessionRevoked', { id: 'other-session', userId: identity.userId });
	expect(f.deps.events.publishInternalEvent).not.toHaveBeenCalledWith('browserSessionRevoked', { id: null, userId: identity.userId });
	expect(f.profiles.update).toHaveBeenCalledExactlyOnceWith({ userId: identity.userId }, { passkeyMfaEnabled: true, twoFactorBackupSecret: started.backupCodes });
	expect(f.sessions.update).toHaveBeenCalledWith({ id: identity.browserSession.id, userId: identity.userId }, { sudoPolicyStamp: expect.stringMatching(/^[a-f0-9]{64}$/) });
	expect(f.sessions.update.mock.calls.every(([, patch]) => !('sudoUntil' in patch) || patch.sudoUntil === null)).toBe(true);
	expect(f.committed.mock.invocationCallOrder.at(-1)!).toBeLessThan(f.deps.events.publishMainStream.mock.invocationCallOrder[0]);
	await expect(f.service.activateComplete(identity, ticket, credential, true)).rejects.toThrow();
});

test.each(['no-key', 'already-active', 'passwordless'] as const)('activation rejects %s without creating pending proof', async kind => {
	const f = fixture();
	if (kind === 'no-key') f.context.keys = [];
	if (kind === 'already-active') f.profile.passkeyMfaEnabled = true;
	if (kind === 'passwordless') f.profile.usePasswordLessLogin = true;
	await expect(f.service.activateStart(identity)).rejects.toThrow(); expect(f.deps.operations.create).not.toHaveBeenCalled();
});

test.each(['policy', 'codes', 'deadline', 'foreign-key', 'counter', 'grant'] as const)('activation rejects %s drift after claiming its own pending operation', async kind => {
	const f = fixture(); await f.service.activateStart(identity);
	if (kind === 'grant') f.context.session.sudoGrantId = 'h'.repeat(43);
	if (kind === 'policy') f.profile.password = 'changed';
	if (kind === 'codes') f.profile.twoFactorBackupSecret = ['changed'];
	if (kind === 'deadline') f.context.session.sudoUntil = new Date(Date.now() + 5000);
	if (kind === 'foreign-key') credential.id = 'BAUG';
	if (kind === 'counter') f.keys.update.mockResolvedValue({ affected: 0, generatedMaps: [], raw: [] });
	try { await expect(f.service.activateComplete(identity, ticket, credential, true)).rejects.toThrow(); } finally { credential.id = 'AQID'; }
	expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.deps.events.publishMainStream).not.toHaveBeenCalled();
});

test('a failed authenticator proof cannot activate MFA or reuse its claim', async () => {
	const f = fixture(); await f.service.activateStart(identity); vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({ verified: false, authenticationInfo: undefined as never });
	await expect(f.service.activateComplete(identity, ticket, credential, true)).rejects.toThrow();
	await expect(f.service.activateComplete(identity, ticket, credential, true)).rejects.toThrow();
	expect(f.keys.update).not.toHaveBeenCalled(); expect(f.profiles.update).not.toHaveBeenCalled();
});

test('an enabled but unusable TOTP does not permit removal of the last independent factor', async () => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true; f.profile.twoFactorEnabled = true; f.profile.twoFactorSecret = null;
	await expect(f.service.removeKey(identity, f.key.id)).rejects.toMatchObject({ code: 'LAST_AUTHENTICATION_FACTOR' });
	expect(f.keys.delete).not.toHaveBeenCalled();
});

test('TOTP removal preserves independent MFA and its recovery codes', async () => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true; f.profile.twoFactorEnabled = true; f.profile.twoFactorBackupSecret = ['keep'];
	await f.service.removeTotp(identity, false);
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: identity.userId }, { twoFactorEnabled: false, twoFactorSecret: null, twoFactorTempSecret: null });
});

test('password-login disable requires strict UV and cannot remove the final remaining key', async () => {
	const f = fixture(); f.profile.usePasswordLessLogin = true;
	const pending = await f.service.disablePasswordStart(identity); expect(pending.options.userVerification).toBe('required');
	await expect(f.service.disablePasswordComplete(identity, ticket, credential)).rejects.toThrow();
	expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.users.update).not.toHaveBeenCalled();
	f.profile.passwordLoginDisabled = true;
	await expect(f.service.removeKey(identity, f.key.id)).rejects.toMatchObject({ code: 'LAST_AUTHENTICATION_FACTOR' });
	await expect(f.service.passwordless(identity, false)).rejects.toThrow();
});

test('password-login disable rotates legacy credentials and keeps only this session with the old sudo deadline', async () => {
	const f = fixture(); f.profile.usePasswordLessLogin = true;
	const until = f.context.session.sudoUntil;
	await f.service.disablePasswordStart(identity);
	vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({ verified: true, authenticationInfo: { credentialID: 'AQID', newCounter: 2, userVerified: true,
		credentialDeviceType: 'singleDevice', credentialBackedUp: false, origin: 'https://synthetic.example', rpID: 'synthetic.example' } });
	await f.service.disablePasswordComplete(identity, ticket, credential);
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: identity.userId }, { passwordLoginDisabled: true });
	expect(f.users.update).toHaveBeenCalledWith(identity.userId, { token: expect.any(String) });
	expect(f.context.session.sudoUntil).toBe(until);
	expect(f.deps.events.publishInternalEvent).toHaveBeenCalledWith('userTokenRegenerated', expect.objectContaining({ oldToken: 'synthetic-native', newToken: expect.any(String) }));
});

test('a consumed or foreign confirmation returns the declared client error while Redis failures remain server failures', async () => {
	const f = fixture();
	f.deps.operations.consume.mockRejectedValueOnce(new SecurityConfirmationRejected('Used'));
	await expect(f.service.activateComplete(identity, ticket, credential, true)).rejects.toMatchObject({ code: 'CONFIRMATION_FAILED' });
	const unavailable = new Error('Synthetic Redis unavailable');
	f.deps.operations.consume.mockRejectedValueOnce(unavailable);
	await expect(f.service.activateComplete(identity, ticket, credential, true)).rejects.toBe(unavailable);
});

test.each(['missing', 'foreign'] as const)('primary activation rejects a %s userHandle before verification', async mode => {
	const f = fixture(); const started = await f.service.passwordlessStart(identity);
	const response = structuredClone(credential);
	if (mode === 'missing') Reflect.deleteProperty(response.response, 'userHandle');
	else response.response.userHandle = Buffer.from('another-owner').toString('base64url');
	await expect(f.service.passwordlessComplete(identity, started.ticket, response)).rejects.toMatchObject({ code: 'CONFIRMATION_FAILED' });
	expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
});

test('password change still rotates legacy credentials and revokes all browser sessions', async () => {
	const f = fixture(); await f.service.changePassword(identity, 'synthetic-new-password');
	expect(f.users.update).toHaveBeenCalledWith(identity.userId, { token: expect.any(String) });
	expect(f.sessions.update).toHaveBeenCalledExactlyOnceWith({ userId: identity.userId }, { revokedAt: expect.any(Date), sudoUntil: null, sudoPolicyStamp: null });
	expect(f.deps.events.publishInternalEvent).toHaveBeenCalledWith('userTokenRegenerated', expect.objectContaining({ oldToken: 'synthetic-native', newToken: expect.any(String) }));
	expect(f.deps.events.publishInternalEvent).toHaveBeenCalledWith('browserSessionRevoked', { id: null, userId: identity.userId });
});

test('existing recovery codes cannot be read, including through factor setup', async () => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true; f.profile.twoFactorBackupSecret = ['stored-secret'];
	await expect(f.service.recoveryCodes(identity, false)).rejects.toMatchObject({ code: 'CONFIRMATION_FAILED' });
	expect(f.deps.sudo.transaction).not.toHaveBeenCalled();
	f.profile.passkeyMfaEnabled = false;
	const activated = await f.service.activateStart(identity); expect(activated.backupCodes).toEqual([]);
	f.profile.twoFactorTempSecret = 'synthetic-secret'; f.deps.totp.validateOtp.mockResolvedValue(true);
	const completed = await f.service.totpComplete(identity, '123456'); expect(completed.backupCodes).toEqual([]);
	expect(f.profiles.update).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ twoFactorBackupSecret: expect.anything() }));
});

test('regeneration invalidates old recovery codes and returns only the new generation', async () => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true; f.profile.twoFactorBackupSecret = ['stored-secret'];
	const result = await f.service.recoveryCodes(identity, true);
	expect(result.backupCodes).toHaveLength(5); expect(result.backupCodes).not.toContain('stored-secret');
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: identity.userId }, { twoFactorBackupSecret: result.backupCodes });
});

test('one session-bound UV assertion enables passwordless without prior sudo', async () => {
	const f = fixture(); f.context.session.sudoUntil = null; f.context.session.sudoGrantId = null;
	f.deps.sudo.status.mockResolvedValue({ active: false, expiresAt: null });
	const started = await f.service.passwordlessStart(identity);
	expect(started.options.userVerification).toBe('required'); expect(started.options.allowCredentials).toBeUndefined();
	vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({ verified: true, authenticationInfo: { userVerified: true, newCounter: 2 } } as never);
	await f.service.passwordlessComplete(identity, started.ticket, credential);
	expect(f.deps.sudo.status).not.toHaveBeenCalled();
	expect(f.deps.sudo.transaction.mock.calls.every(call => call[2] === false)).toBe(true);
	expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ requireUserVerification: true, expectedChallenge: started.options.challenge }));
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: identity.userId }, { usePasswordLessLogin: true });
	await expect(f.service.passwordlessComplete(identity, started.ticket, credential)).rejects.toThrow();
});

test.each(['no-uv', 'policy', 'foreign-session', 'expired'] as const)('passwordless single proof rejects %s without changing policy', async kind => {
	const f = fixture(); const started = await f.service.passwordlessStart(identity);
	if (kind === 'policy') f.profile.password = 'changed';
	if (kind === 'expired') f.deps.operations.consume.mockImplementationOnce(async () => ({ ...f.pending()!, expiresAtMonotonic: performance.now() - 1 }));
	const actor = kind === 'foreign-session' ? { ...identity, browserSession: { id: 'foreign', userId: identity.userId } } : identity;
	await expect(f.service.passwordlessComplete(actor, started.ticket, credential)).rejects.toThrow();
	expect(f.profiles.update).not.toHaveBeenCalled();
});
