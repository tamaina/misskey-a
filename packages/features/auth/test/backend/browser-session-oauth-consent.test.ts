/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import Fastify from 'fastify';
import type { Repository, EntityManager } from 'typeorm';
import { MiOAuthApproval } from '../../backend/models/OAuthApproval.js';
import { MiUserProfile } from '../../../users/backend/models/UserProfile.js';
import type { CredentialIssuanceAuthorization } from '../../backend/credential-issuance.js';
import { afterEach, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OAuth2ProviderService } from '../../backend/oauth/OAuth2ProviderService.js';
import type { AuthenticateService } from '../../backend/transport/AuthenticateService.js';
import type { Logger } from '../../../runtime/backend/logging/logger.js';
import type { MiAccessToken } from '../../backend/models/AccessToken.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';

const cleanups: (() => Promise<unknown>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });

async function fixture() {
	const redis = mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[9]>();
	const auth = mockDeep<AuthenticateService>();
	const cache = mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[5]>();
	const loggers = mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[7]>();
	loggers.getLogger.mockReturnValue(mockDeep<Logger>());
	const config = mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[0]>({ url: 'https://instance.invalid' });
	const local = mockDeep<CredentialIssuanceAuthorization>(); const manager = mockDeep<EntityManager>(); const ids = mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[3]>(); ids.gen.mockReturnValue('approval1');
	const provider = new OAuth2ProviderService(config, mockDeep(), mockDeep(), ids, mockDeep(), cache, mockDeep(), loggers, mockDeep(), redis, auth, local);
	const user = mockDeep<MiLocalUser>({ id: 'alice', host: null, isSuspended: false, isDeleted: false, token: 'synthetic-native' });
	const approvals = mockDeep<Repository<MiOAuthApproval>>();
	manager.getRepository.mockImplementation(entity => { if (entity !== MiOAuthApproval) throw new Error('Unexpected synthetic repository'); return approvals as unknown as ReturnType<EntityManager['getRepository']>; });
	redis.eval.mockResolvedValue(JSON.stringify({ client: { id: 'https://client.invalid/', cimd: false }, request: { clientId: 'https://client.invalid/', redirectUri: 'https://client.invalid/callback', scopes: ['read:account'], codeChallenge: 'a'.repeat(43), codeChallengeMethod: 'S256' } }));
	let committed = false; local.transaction.mockImplementation(async (identity, run) => { const result = await run({ manager, user, profile: new MiUserProfile({ userId: user.id, password: 'synthetic-hash', passwordLoginDisabled: false, twoFactorEnabled: false, twoFactorSecret: null, passkeyMfaEnabled: false, usePasswordLessLogin: false }), keys: [], session: { id: identity.browserSession.id, sudoGrantId: 'g'.repeat(43), sudoUntil: new Date(Date.now() + 300_000) } as never }); committed = true; return result; });
	redis.set.mockImplementation(async () => { expect(committed).toBe(true); return 'OK'; });
	const app = Fastify();
	cleanups.push(() => app.close());
	await provider.createServer(app);
	const invoke = (token: string) => app.inject({ method: 'POST', url: '/decision', headers: { origin: 'https://instance.invalid' }, payload: { transaction_id: 'synthetic-transaction', login_token: token } });
	return { auth, cache, user, redis, invoke, local };
}

test('browser session consent uses durable first-party authentication without changing grant scope', async () => {
	const h = await fixture();
	h.auth.authenticate.mockResolvedValue([h.user, null, { id: 'session1', userId: 'alice' }]);
	const response = await h.invoke(`bs_${'a'.repeat(43)}`);
	expect(response.statusCode).toBe(302);
	expect(h.auth.authenticate).toHaveBeenCalledOnce();
	expect(h.cache.localUserByNativeTokenCache.fetch).not.toHaveBeenCalled();
	const stored = JSON.parse(String(h.redis.set.mock.calls[0][1]));
	expect(stored.grant.userId).toBe('alice');
	expect(stored.grant.scopes).toEqual(['read:account']);
	expect(stored.grant.approvalId).toBe('approval1'); expect(stored.grant.expiresAt).toBeNull();
});

test('revoked browser credentials cannot approve consent or fall back to legacy cache', async () => {
	const h = await fixture();
	h.auth.authenticate.mockRejectedValue(new Error('revoked'));
	const response = await h.invoke(`bs_${'a'.repeat(43)}`);
	expect(response.statusCode).toBe(400);
	expect(response.json().error).toBe('invalid_request');
	expect(h.redis.set).not.toHaveBeenCalled();
	expect(h.cache.localUserByNativeTokenCache.fetch).not.toHaveBeenCalled();
});

test('a scoped app cannot be substituted for a first-party consent login', async () => {
	const h = await fixture();
	h.auth.authenticate.mockResolvedValue([h.user, mockDeep<MiAccessToken>({ permission: ['read:account'] })]);
	expect((await h.invoke(`bs_${'a'.repeat(43)}`)).statusCode).toBe(400);
	expect(h.redis.set).not.toHaveBeenCalled();
});

test('legacy master consent cannot substitute for current individual sudo', async () => {
	const h = await fixture();
	h.cache.localUserByNativeTokenCache.fetch.mockResolvedValue(h.user);
	expect((await h.invoke('a'.repeat(16))).statusCode).toBe(400);
	expect(h.cache.localUserByNativeTokenCache.fetch).not.toHaveBeenCalled(); expect(h.local.transaction).not.toHaveBeenCalled();
	expect(h.auth.authenticate).not.toHaveBeenCalled();
});
