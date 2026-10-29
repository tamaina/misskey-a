/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { RedisKVCache } from '@features/runtime/backend/cache/cache.js';
import { MiUserKeypair } from '@features/federation/backend/models/UserKeypair.js';
import type { UserKeypairsRepository } from '@features/persistence/backend/repositories/models.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserKeypairService } from '@features/federation/backend/services/UserKeypairService.js';

const { privateKey } = generateKeyPairSync('rsa', {
	modulusLength: 1024,
	privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
	publicKeyEncoding: { type: 'spki', format: 'pem' },
});

describe('legacy RSA key conversion', () => {
	test('waits for persistence before returning the converted key', async () => {
		let release!: () => void;
		const pending = new Promise<void>(resolve => { release = resolve; });
		const update = vi.fn().mockReturnValue(pending);
		const service: UserKeypairService = Object.assign(Object.create(UserKeypairService.prototype), {
			userKeypairsRepository: { findOneByOrFail: async () => ({ privateKey }), update },
		});
		let finished = false;
		const result = service.fetcher('user').then(key => { finished = true; return key; });
		await vi.waitFor(() => expect(update).toHaveBeenCalled());
		expect(finished).toBe(false);
		release();
		expect((await result).privateKey).toContain('BEGIN PRIVATE KEY');
	});

	test('propagates a failed write instead of populating the cache', async () => {
		const error = new Error('write failed');
		const service: UserKeypairService = Object.assign(Object.create(UserKeypairService.prototype), {
			userKeypairsRepository: {
				findOneByOrFail: async () => ({ privateKey }),
				update: vi.fn().mockRejectedValue(error),
			},
		});
		await expect(service.fetcher('user')).rejects.toBe(error);
	});
	test.each(['resolve', 'reject'] as const)('Ed25519 preparation awaits the final cache write (%s)', async outcome => {
		const cache = mock<RedisKVCache<MiUserKeypair>>();
		const keypair = new MiUserKeypair({ userId: 'user', privateKey, ed25519PublicKey: null, ed25519PrivateKey: null });
		cache.fetch.mockResolvedValue(keypair);
		const repository = mock<UserKeypairsRepository>();
		repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
		const events = mock<GlobalEventService>();
		let resolve!: () => void;
		let reject!: (error: Error) => void;
		cache.set.mockReturnValue(new Promise<void>((yes, no) => { resolve = yes; reject = no; }));
		const refresh = vi.fn().mockResolvedValue(undefined);
		const service: UserKeypairService = Object.assign(Object.create(UserKeypairService.prototype), {
			keypairEntityCache: cache, userKeypairsRepository: repository, globalEventService: events,
		});
		Object.defineProperty(service, 'refresh', { value: refresh, configurable: true });
		let settled = false;
		const result = service.refreshAndPrepareEd25519KeyPair('user');
		const observed = result.then(value => { settled = true; return value; }, error => { settled = true; throw error; });
		// Attach a rejection observer before releasing the deliberately failing cache write.
		const failure = outcome === 'reject' ? expect(observed).rejects.toThrow('cache write failed') : undefined;
		await vi.waitFor(() => expect(cache.set).toHaveBeenCalledOnce());
		expect(settled).toBe(false);
		expect(repository.update).toHaveBeenCalledOnce();
		if (outcome === 'reject') {
			reject(new Error('cache write failed'));
			await failure;
		} else {
			resolve();
			const prepared = await observed;
			expect(prepared).toMatchObject({ userId: 'user', privateKey });
			if (prepared == null) throw new Error('expected winning preparation');
			expect(prepared.ed25519PrivateKey).toContain('BEGIN PRIVATE KEY');
		}
	});
});
