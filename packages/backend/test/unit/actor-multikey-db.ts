/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { loadConfig } from '@/config.js';
import { createPostgresDataSource } from '@features/persistence/backend/postgres.js';
import { createRepositorySet } from '@features/persistence/backend/repositories/factory.js';
import { MiUser, type MiRemoteUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserPublickey } from '@features/federation/backend/models/UserPublickey.js';
import { MiUserKeypair } from '@features/federation/backend/models/UserKeypair.js';
import type { NotesRepository, UsersRepository, UserPublickeysRepository, UserKeypairsRepository } from '@features/persistence/backend/repositories/models.js';
import { UserKeypairService } from '@features/federation/backend/services/UserKeypairService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import { ApDbResolverService } from '@features/federation/backend/services/ApDbResolverService.js';
import { extractActorPublicKeys, storeActorPublicKeys } from '@features/federation/backend/protocol/misc/actor-public-keys.js';
import { JsonLd } from '@features/federation/backend/services/JsonLdService.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { CacheService } from '@features/users/backend/services/CacheService.js';
import type { ApLoggerService } from '@features/federation/backend/services/ApLoggerService.js';
import type { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import type { Resolver } from '@features/federation/backend/services/ApResolverService.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { signAsDraftToRequest, parseRequestSignature, verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';
import { APMultipleKeys1708980134301 } from '../../migration/1708980134301-APMultipleKeys.js';
import { APMultipleKeys1709269211718 } from '../../migration/1709269211718-APMultipleKeysFix1.js';
import { actor, actorId, host, multikey } from '../misc/public-multikey.js';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const rotated = generateKeyPairSync('ed25519');
const privatePem = (pair: typeof rsa) => pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

describe('actor Multikey database and verification path', () => {
	let db: DataSource;
	const config = loadConfig();
	const subscriber = new EventEmitter();
	const cacheWrites = vi.fn();
	const publisher = vi.fn((type: string, body: unknown) => subscriber.emit('message', 'internal', JSON.stringify({ channel: 'internal', message: { type, body } })));
	let resolver: ApDbResolverService;
	let person: ApPersonService;
	const keys = () => db.getRepository(MiUserPublickey);
	const users = () => db.getRepository(MiUser);

	beforeAll(async () => {
		// The normal test configuration is a disposable DB; local overrides isolate this fixture.
		const dbConfig = process.env.MULTIKEY_TEST_DB_PORT == null ? config.db : {
			...config.db, port: Number(process.env.MULTIKEY_TEST_DB_PORT), db: 'test-multikey',
		};
		db = createPostgresDataSource({ ...config, db: dbConfig });
		await db.initialize();
		const utility = mock<UtilityService>();
		utility.punyHost.mockImplementation(host);
		utility.toPuny.mockImplementation(value => value);
		utility.isUriLocal.mockReturnValue(false);
		const logger = mock<Logger>();
		const logging = mock<ApLoggerService>();
		logging.logger = logger;
		logger.createSubLogger.mockReturnValue(logger);
		person = Object.assign(Object.create(ApPersonService.prototype), {
			db, config, meta: {}, utilityService: utility, logger,
			usersRepository: users(), userProfilesRepository: db.getRepository(MiUserProfile),
			idService: { gen: () => 'multikey-alice' },
			apNoteService: { extractEmojis: vi.fn().mockResolvedValue([]) },
			cacheService: { uriPersonCache: { set: cacheWrites } },
			usersChart: { update: vi.fn() }, hashtagService: { updateUsertags: vi.fn() },
			globalEventService: { publishInternalEvent: publisher },
			userEntityService: { isRemoteUser: (user: MiUser) => user.host != null },
			followingsRepository: { update: vi.fn().mockResolvedValue(undefined) },
		});
		for (const [name, value] of Object.entries({
			fetchPerson: async (uri: string) => await users().findOneBy({ uri }) as MiRemoteUser | null,
			isPublicCollection: vi.fn().mockResolvedValue(true),
			resolveAvatarAndBanner: vi.fn().mockResolvedValue({ avatarId: null, bannerId: null }),
			updateFeatured: vi.fn().mockResolvedValue(undefined),
		})) Object.defineProperty(person, name, { value, configurable: true });
		const resolution = mock<ApPersonService>();
		resolution.resolvePerson.mockImplementation(async uri => await users().findOneByOrFail({ uri }) as MiRemoteUser);
		resolver = new ApDbResolverService(config, users() as UsersRepository, mock<NotesRepository>(), keys() as UserPublickeysRepository, subscriber as unknown as Redis.Redis, mock<CacheService>(), resolution, logging, utility);
	});

	afterEach(async () => {
		await users().delete([{ id: 'multikey-alice' }, { id: 'multikey-bob' }]);
		resolver.refreshCacheByUserId('multikey-alice');
		publisher.mockClear();
		cacheWrites.mockClear();
	});
	afterAll(async () => { resolver?.dispose(); if (db?.isInitialized) await db.destroy(); });

	async function create(entries = [multikey(ed.publicKey)]) {
		return await person.createPerson(actorId, { resolve: async () => actor({ assertionMethod: entries }) } as unknown as Resolver);
	}

	async function update(extra: Parameters<typeof actor>[0]) {
		await person.updatePerson(actorId, {} as Resolver, actor(extra));
	}

	async function verifies(pair: typeof rsa, keyId = actorId + '#key') {
		const request = { method: 'POST', url: 'https://recipient.example:8443/inbox?token=1', headers: { host: 'recipient.example:8443', date: new Date().toUTCString() } };
		await signAsDraftToRequest(request, { keyId, privateKeyPem: privatePem(pair) }, ['(request-target)', 'host', 'date']);
		const parsed = parseRequestSignature(request);
		if (parsed.version !== 'draft') throw new Error('Expected draft signature');
		const auth = await resolver.getAuthUserFromApId(actorId, keyId);
		return auth?.key == null ? false : await verifyDraftSignature(JSON.parse(JSON.stringify(parsed.value)), auth.key.keyPem);
	}

	test.each([rsa, ed])('creates, stores, resolves, and verifies an embedded public key', async pair => {
		await create([multikey(pair.publicKey)]);
		expect(await verifies(pair)).toBe(true);
		const stored = await keys().findOneByOrFail({ keyId: actorId + '#key' });
		expect(stored.keyPem).toContain('BEGIN PUBLIC KEY');
		expect(await resolver.getAuthUserFromApId(actorId, 'https://other.example/key')).toBeNull();
		const otherAlgorithm = pair === rsa ? ed : rsa;
		expect(await verifies(otherAlgorithm)).toBe(false);
	});

	test('commits rotations before the update event and invalidates cached material', async () => {
		await create();
		expect(await verifies(ed)).toBe(true);
		let observed: Promise<MiUserPublickey> | undefined;
		publisher.mockImplementationOnce((type, body) => {
			observed = keys().findOneByOrFail({ keyId: actorId + '#key' });
			return subscriber.emit('message', 'internal', JSON.stringify({ channel: 'internal', message: { type, body } }));
		});
		await update({ assertionMethod: [multikey(rotated.publicKey)] });
		expect((await observed)?.keyPem).toBe(rotated.publicKey.export({ type: 'spki', format: 'pem' }).toString());
		expect(await verifies(rotated)).toBe(true);
		expect(await verifies(ed)).toBe(false);
		await update({ assertionMethod: [multikey(ed.publicKey, actorId + '#new')] });
		expect(await verifies(ed, actorId + '#new')).toBe(true);
		expect(await verifies(rotated)).toBe(false);
		expect(publisher).toHaveBeenCalledTimes(2);
	});

	test('preserves omitted and malformed-only keys, but explicit empty removes keys', async () => {
		await create();
		await update({});
		await update({ assertionMethod: [{ ...multikey(ed.publicKey), publicKeyMultibase: 'invalid' }] });
		expect(await verifies(ed)).toBe(true);
		await update({ assertionMethod: [] });
		expect(await keys().countBy({ userId: 'multikey-alice' })).toBe(0);
		expect(await verifies(ed)).toBe(false);
	});

	test('empty assertionMethod retains current legacy material and JSON-LD RSA verification', async () => {
		await create();
		const publicKeyPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		await update({ assertionMethod: [], publicKey: { type: 'Key', id: actorId + '#rsa', owner: actorId, publicKeyPem } });
		expect(await verifies(rsa, actorId + '#rsa')).toBe(true);
		expect(await verifies(ed)).toBe(false);
		const ld = new JsonLd(mock<HttpRequestService>());
		vi.spyOn(ld, 'createVerifyData').mockResolvedValue('unchanged signature base');
		const signed = await ld.signRsaSignature2017({ id: actorId + '/object' }, privatePem(rsa), actorId + '#rsa');
		const auth = await resolver.getAuthUserFromApId(actorId, actorId + '#rsa');
		expect(await ld.verifyRsaSignature2017(signed, auth!.key!.keyPem)).toBe(true);
	});

	test('rejects a conflicting ID while retaining unrelated valid keys', async () => {
		await create();
		await update({ assertionMethod: [multikey(ed.publicKey), multikey(rotated.publicKey), multikey(rsa.publicKey, actorId + '#good')] });
		expect(await verifies(ed)).toBe(false);
		expect(await verifies(rsa, actorId + '#good')).toBe(true);
	});

	test('foreign actors cannot overwrite an occupied keyId, even with concurrent inserts', async () => {
		await create();
		await users().insert({ id: 'multikey-bob', username: 'bob', usernameLower: 'bob', host: 'remote.example', uri: actorId + '-bob' });
		const first = extractActorPublicKeys(actor({ assertionMethod: [multikey(ed.publicKey, actorId + '#race')] }), host)!;
		const bobId = actorId + '-bob';
		const second = extractActorPublicKeys(actor({ id: bobId, assertionMethod: [{ ...multikey(rotated.publicKey, actorId + '#race'), controller: bobId }] }), host)!;
		await Promise.all([
			db.transaction(manager => storeActorPublicKeys(manager, 'multikey-alice', { ...first, replace: false })),
			db.transaction(manager => storeActorPublicKeys(manager, 'multikey-bob', { ...second, replace: false })),
		]);
		const occupied = await keys().findOneByOrFail({ keyId: actorId + '#race' });
		const original = { userId: occupied.userId, keyPem: occupied.keyPem };
		const foreign = occupied.userId === 'multikey-alice' ? 'multikey-bob' : 'multikey-alice';
		await db.transaction(manager => storeActorPublicKeys(manager, foreign, { ...second, replace: false }));
		expect(await keys().findOneByOrFail({ keyId: actorId + '#race' })).toMatchObject(original);
	});

	test('readers see the old key set until the complete replacement commits', async () => {
		await create();
		const runner = db.createQueryRunner();
		await runner.connect();
		await runner.startTransaction();
		try {
			await storeActorPublicKeys(runner.manager, 'multikey-alice', extractActorPublicKeys(actor({ assertionMethod: [multikey(rotated.publicKey, actorId + '#new')] }), host)!);
			expect((await keys().findBy({ userId: 'multikey-alice' })).map(key => key.keyId)).toEqual([actorId + '#key']);
			await runner.commitTransaction();
			expect((await keys().findBy({ userId: 'multikey-alice' })).map(key => key.keyId)).toEqual([actorId + '#new']);
		} finally {
			if (runner.isTransactionActive) await runner.rollbackTransaction();
			await runner.release();
		}
	});

	test('malformed entries do not revoke existing keys when another valid key is added', async () => {
		await create();
		await update({ assertionMethod: [multikey(rsa.publicKey, actorId + '#rsa'), { ...multikey(rotated.publicKey), controller: actorId + '-other' }] });
		expect(await verifies(ed)).toBe(true);
		expect(await verifies(rsa, actorId + '#rsa')).toBe(true);
	});

	test('does not treat a standalone Multikey document as an Actor', async () => {
		await expect(person.createPerson(actorId, { resolve: async () => multikey(ed.publicKey) } as unknown as Resolver)).rejects.toThrow('invalid Actor type');
		expect(await keys().countBy({ userId: 'multikey-alice' })).toBe(0);
	});

	test('upgrades legacy PKCS#1 storage without regenerating RSA or existing Ed25519 keys', async () => {
		await create();
		const repository = db.getRepository(MiUserKeypair);
		const old = {
			userId: 'multikey-alice', publicKey: rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
			privateKey: rsa.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
			ed25519PublicKey: ed.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
			ed25519PrivateKey: privatePem(ed),
		};
		await repository.insert(old);
		const redis = mock<Redis.Redis>();
		redis.get.mockImplementation(async key => key.includes('userKeypair:v3') ? null : JSON.stringify(old));
		const entities = mock<UserEntityService>();
		entities.genLocalUserUri.mockReturnValue(actorId);
		const service = new UserKeypairService(redis, mock<Redis.Redis>(), repository as UserKeypairsRepository, mock<GlobalEventService>(), entities);
		try {
			const loaded = await service.getUserKeypair(old.userId);
			const saved = await repository.findOneByOrFail({ userId: old.userId });
			expect(saved.privateKey).toContain('BEGIN PRIVATE KEY');
			expect(saved.publicKey).toBe(old.publicKey);
			expect(createPublicKey(saved.privateKey).export({ type: 'spki', format: 'pem' }).toString()).toBe(old.publicKey);
			expect(saved.ed25519PublicKey).toBe(old.ed25519PublicKey);
			expect(saved.ed25519PrivateKey).toBe(old.ed25519PrivateKey);
			expect(redis.get).toHaveBeenCalledWith(expect.stringContaining('userKeypair:v3'));
			for (const [level, pair] of [['01', rsa], ['11', rsa], ['02', ed], ['unknown', rsa]] as const) {
				const key = await service.getLocalUserPrivateKey(loaded, level);
				const request = { method: 'GET', url: 'https://recipient.example/inbox', headers: { host: 'recipient.example' } };
				const signed = await signAsDraftToRequest(request, key, ['(request-target)', 'host']);
				expect(key.keyId).toBe(actorId + (level === '02' ? '#ed25519-key' : '#main-key'));
				expect(verify(level === '02' ? null : 'sha256', Buffer.from(signed.signingString), pair.publicKey, Buffer.from(signed.signature, 'base64'))).toBe(true);
			}
		} finally {
			service.dispose();
		}
	});

	test('rolls back a partial refresh and emits no success event on failure', async () => {
		await create();
		const query = vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('write failed'));
		await expect(update({ assertionMethod: [multikey(rotated.publicKey)] })).rejects.toThrow('write failed');
		expect(publisher).not.toHaveBeenCalled();
		query.mockRestore();
		expect(await verifies(ed)).toBe(true);
		await expect(db.transaction(async manager => {
			await storeActorPublicKeys(manager, 'multikey-alice', extractActorPublicKeys(actor({ assertionMethod: [] }), host)!);
			throw new Error('abort');
		})).rejects.toThrow('abort');
		expect(await verifies(ed)).toBe(true);
	});

	async function withKeypairServices(run: (first: UserKeypairService, second: UserKeypairService, redis: Redis.Redis, events: ReturnType<typeof mock<GlobalEventService>>) => Promise<void>) {
		const redis = new Redis.Redis({ ...config.redis, lazyConnect: true });
		await redis.connect();
		const entities = mock<UserEntityService>();
		entities.genLocalUserUri.mockReturnValue(actorId);
		const events = mock<GlobalEventService>();
		const repository: UserKeypairsRepository = createRepositorySet(db).userKeypairsRepository;
		const first = new UserKeypairService(redis, mock<Redis.Redis>(), repository, events, entities);
		const second = new UserKeypairService(redis, mock<Redis.Redis>(), repository, events, entities);
		try {
			await redis.del('kvcache:userKeypair:v2:multikey-alice', 'kvcache:userKeypair:v3:multikey-alice');
			await run(first, second, redis, events);
		} finally {
			first.dispose();
			second.dispose();
			await redis.del('kvcache:userKeypair:v2:multikey-alice', 'kvcache:userKeypair:v3:multikey-alice');
			await redis.quit();
		}
	}

	test('ignores old Redis v2 payloads and retains both DB keys on cold, warm and restarted services', async () => {
		await create();
		const repository = db.getRepository(MiUserKeypair);
		const stored = new MiUserKeypair({ userId: 'multikey-alice', publicKey: rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString(), privateKey: privatePem(rsa), ed25519PublicKey: ed.publicKey.export({ type: 'spki', format: 'pem' }).toString(), ed25519PrivateKey: privatePem(ed) });
		await repository.insert(stored);
		await withKeypairServices(async (first, restarted, redis) => {
			const stale = { userId: stored.userId, publicKey: stored.publicKey, privateKey: rsa.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString() };
			await redis.set('kvcache:userKeypair:v2:multikey-alice', JSON.stringify(stale));
			const cold = await first.getUserKeypair(stored.userId);
			expect(cold).toMatchObject(stored);
			expect(await first.getUserKeypair(stored.userId)).toBe(cold);
			// A fresh service has empty memory caches and must consume only the new namespace.
			const afterRestart = await restarted.getUserKeypair(stored.userId);
			expect(afterRestart).toMatchObject(JSON.parse(JSON.stringify(stored)));
			expect(afterRestart).not.toBe(cold);
			expect(JSON.parse((await redis.get('kvcache:userKeypair:v2:multikey-alice'))!)).toEqual(stale);
			expect(JSON.parse((await redis.get('kvcache:userKeypair:v3:multikey-alice'))!)).toMatchObject(JSON.parse(JSON.stringify(stored)));
			expect(await repository.findOneByOrFail({ userId: stored.userId })).toMatchObject(stored);
		});
	});

	test('concurrent Ed25519 preparation uses DB compare-and-set and never stores half a keypair', async () => {
		await create();
		const repository = db.getRepository(MiUserKeypair);
		const stored = new MiUserKeypair({ userId: 'multikey-alice', publicKey: rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString(), privateKey: privatePem(rsa), ed25519PublicKey: null, ed25519PrivateKey: null });
		await repository.insert(stored);
		await withKeypairServices(async (first, second, _redis, events) => {
			await Promise.all([first.getUserKeypair(stored.userId), second.getUserKeypair(stored.userId)]);
			const results = await Promise.all([first.refreshAndPrepareEd25519KeyPair(stored.userId), second.refreshAndPrepareEd25519KeyPair(stored.userId)]);
			const current = await repository.findOneByOrFail({ userId: stored.userId });
			expect(current.publicKey).toBe(stored.publicKey);
			expect(current.privateKey).toBe(stored.privateKey);
			expect(current.ed25519PrivateKey).not.toBeNull();
			expect(current.ed25519PublicKey).not.toBeNull();
			expect(createPublicKey(current.ed25519PrivateKey!).export({ type: 'spki', format: 'pem' }).toString()).toBe(current.ed25519PublicKey);
			expect(results.filter(Boolean)).toHaveLength(1);
			expect(events.publishInternalEvent).toHaveBeenCalledTimes(1);
			for (const service of [first, second]) {
				await service.refresh(stored.userId);
				expect(await service.getUserKeypair(stored.userId)).toMatchObject(current);
			}
		});
	});

	test('a real database error rolls back the complete keyset without publishing partial success', async () => {
		await create();
		const before = await users().findOneByOrFail({ id: 'multikey-alice' });
		const beforeCacheWrites = cacheWrites.mock.calls.length;
		await db.query(`CREATE FUNCTION multikey_fixture_reject_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'multikey fixture write failure'; END $$`);
		try {
			await db.query(`CREATE TRIGGER multikey_fixture_reject_write BEFORE INSERT OR UPDATE ON "user_publickey" FOR EACH ROW WHEN (NEW."userId" = 'multikey-alice' AND NEW."keyId" = 'https://remote.example/users/alice#new') EXECUTE FUNCTION multikey_fixture_reject_write()`);
			await expect(update({ name: 'committed before key failure', assertionMethod: [multikey(rotated.publicKey, actorId + '#new')] })).rejects.toThrow('multikey fixture write failure');
			const after = await users().findOneByOrFail({ id: before.id });
			// Upstream guarantees KEYSET atomicity; ordinary Actor fields commit earlier.
			expect(after.name).toBe('committed before key failure');
			expect({ id: after.id, uri: after.uri, host: after.host, username: after.username }).toEqual({ id: before.id, uri: before.uri, host: before.host, username: before.username });
			expect(cacheWrites).toHaveBeenCalledTimes(beforeCacheWrites);
			expect((await keys().findBy({ userId: 'multikey-alice' })).map(key => key.keyId)).toEqual([actorId + '#key']);
			expect(await verifies(ed)).toBe(true);
			expect(publisher).not.toHaveBeenCalled();
		} finally {
			await db.query('DROP TRIGGER IF EXISTS multikey_fixture_reject_write ON "user_publickey"');
			await db.query('DROP FUNCTION multikey_fixture_reject_write()');
		}
	});

	test('migration down retains primary RSA identity while explicitly losing secondary keys; up restores the new shape', async () => {
		await create([multikey(rsa.publicKey, actorId + '#main-key'), multikey(ed.publicKey, actorId + '#ed25519-key')]);
		const repository = db.getRepository(MiUserKeypair);
		const original = new MiUserKeypair({ userId: 'multikey-alice', publicKey: rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString(), privateKey: privatePem(rsa), ed25519PublicKey: ed.publicKey.export({ type: 'spki', format: 'pem' }).toString(), ed25519PrivateKey: privatePem(ed) });
		await repository.insert(original);
		const runner = db.createQueryRunner();
		await runner.connect();
		await runner.startTransaction();
		try {
			const migration = new APMultipleKeys1708980134301();
			const fix = new APMultipleKeys1709269211718();
			await fix.down(runner);
			await migration.down(runner);
			const remote: Array<{ keyId: string; keyPem: string }> = await runner.query('SELECT "keyId", "keyPem" FROM "user_publickey" WHERE "userId" = $1', [original.userId]);
			expect(remote).toEqual([{ keyId: actorId + '#main-key', keyPem: original.publicKey }]);
			const local: Array<{ payload: Record<string, unknown> }> = await runner.query('SELECT to_jsonb(k) AS payload FROM "user_keypair" k WHERE "userId" = $1', [original.userId]);
			expect(local[0].payload).toMatchObject({ publicKey: original.publicKey, privateKey: original.privateKey });
			expect(local[0].payload).not.toHaveProperty('ed25519PublicKey');
			expect(local[0].payload).not.toHaveProperty('ed25519PrivateKey');
			await migration.up(runner);
			await fix.up(runner);
			const restored = await runner.manager.getRepository(MiUserKeypair).findOneByOrFail({ userId: original.userId });
			expect(restored).toMatchObject({ publicKey: original.publicKey, privateKey: original.privateKey, ed25519PublicKey: null, ed25519PrivateKey: null });
			expect(await runner.manager.getRepository(MiUserPublickey).countBy({ userId: original.userId })).toBe(1);
			// Secondary material is deliberately not recoverable from the reversed schema.
			await runner.manager.getRepository(MiUserPublickey).insert({ userId: original.userId, keyId: actorId + '#new-secondary', keyPem: ed.publicKey.export({ type: 'spki', format: 'pem' }).toString() });
			expect(await runner.manager.getRepository(MiUserPublickey).countBy({ userId: original.userId })).toBe(2);
		} finally {
			// Never commit temporary whole-schema down/up changes to the shared test DB.
			if (runner.isTransactionActive) await runner.rollbackTransaction();
			await runner.release();
		}
	});

	test('a legacy queued RSA PKCS#1 hint verifies old material without reverting the current DB keypair', async () => {
		await create();
		const repository = db.getRepository(MiUserKeypair);
		const rsaB = generateKeyPairSync('rsa', { modulusLength: 2048 });
		const publicA = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		const publicB = rsaB.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		await repository.insert({ userId: 'multikey-alice', publicKey: publicA, privateKey: privatePem(rsa), ed25519PublicKey: null, ed25519PrivateKey: null });
		const queued = { keyId: actorId + '#main-key', privateKeyPem: rsa.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString() };
		const originalQueue = JSON.stringify(queued);
		await withKeypairServices(async first => {
			const oldCurrent = await first.getLocalUserPrivateKey('multikey-alice');
			await repository.update({ userId: 'multikey-alice' }, { publicKey: publicB, privateKey: privatePem(rsaB) });
			await first.refresh('multikey-alice');
			const currentB = await first.getLocalUserPrivateKey('multikey-alice');
			const keyWrites = vi.spyOn(repository, 'update');
			try {
				const queuedA = await first.getLocalUserPrivateKey(JSON.parse(originalQueue));
				const currentAfterQueue = await first.getLocalUserPrivateKey('multikey-alice');
				for (const [key, expected, rejected] of [[oldCurrent, rsa, rsaB], [currentB, rsaB, rsa], [queuedA, rsa, rsaB], [currentAfterQueue, rsaB, rsa]] as const) {
					const request = { method: 'POST', url: 'https://recipient.example/inbox?', headers: { host: 'recipient.example', date: new Date().toUTCString() } };
					const signed = await signAsDraftToRequest(request, key, ['(request-target)', 'host', 'date']);
					const base = Buffer.from(signed.signingString);
					const signature = Buffer.from(signed.signature, 'base64');
					expect(key.keyId).toBe(queued.keyId);
					expect(verify('sha256', base, expected.publicKey, signature)).toBe(true);
					expect(verify('sha256', base, rejected.publicKey, signature)).toBe(false);
				}
				expect(JSON.stringify(queued)).toBe(originalQueue);
				expect(await repository.findOneByOrFail({ userId: 'multikey-alice' })).toMatchObject({ publicKey: publicB, privateKey: privatePem(rsaB), ed25519PublicKey: null, ed25519PrivateKey: null });
				expect(keyWrites).not.toHaveBeenCalled();
			} finally {
				keyWrites.mockRestore();
			}
		});
	});

	test('failed Ed25519 DB compare-and-set leaves both columns empty and emits no update event', async () => {
		await create();
		const repository = db.getRepository(MiUserKeypair);
		const stored = new MiUserKeypair({ userId: 'multikey-alice', publicKey: rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString(), privateKey: privatePem(rsa), ed25519PublicKey: null, ed25519PrivateKey: null });
		await repository.insert(stored);
		await db.query(`CREATE FUNCTION multikey_fixture_reject_ed() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'multikey fixture Ed write failure'; END $$`);
		try {
			await db.query(`CREATE TRIGGER multikey_fixture_reject_ed BEFORE UPDATE ON "user_keypair" FOR EACH ROW WHEN (NEW."userId" = 'multikey-alice' AND NEW."ed25519PublicKey" IS NOT NULL) EXECUTE FUNCTION multikey_fixture_reject_ed()`);
			await withKeypairServices(async (first, _second, redis, events) => {
				await expect(first.refreshAndPrepareEd25519KeyPair(stored.userId)).rejects.toThrow('multikey fixture Ed write failure');
				expect(await repository.findOneByOrFail({ userId: stored.userId })).toMatchObject(stored);
				expect(events.publishInternalEvent).not.toHaveBeenCalled();
				expect(await first.getUserKeypair(stored.userId)).toMatchObject(stored);
				expect(JSON.parse((await redis.get('kvcache:userKeypair:v3:multikey-alice'))!)).toMatchObject(JSON.parse(JSON.stringify(stored)));
			});
		} finally {
			await db.query('DROP TRIGGER IF EXISTS multikey_fixture_reject_ed ON "user_keypair"');
			await db.query('DROP FUNCTION multikey_fixture_reject_ed()');
		}
	});
});
