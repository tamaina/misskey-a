/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync } from 'node:crypto';
import { QueryFailedError, type EntityManager } from 'typeorm';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ApPersonService } from '../../backend/services/ApPersonService.js';
import { ApDbResolverService } from '../../backend/services/ApDbResolverService.js';
import { ApNoteService } from '../../backend/services/ApNoteService.js';
import { ApInboxService } from '../../backend/services/ApInboxService.js';
import { RemoteUserResolveService } from '../../backend/services/RemoteUserResolveService.js';
import { MiUser, type MiRemoteUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { encodeActorPublicMultikey } from '../../backend/protocol/misc/actor-public-keys.js';
import type { Resolver } from '../../backend/services/ApResolverService.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import type { IActor, IObject } from '../../backend/protocol/type.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';

vi.mock('@features/runtime/backend/cache/distributed-lock.js', async importOriginal => ({
	...await importOriginal<object>(), acquireApObjectLock: vi.fn(async () => vi.fn()),
}));

const uri = 'https://author.example/users/alice';
const keyId = `${uri}#ed25519-key`;
const publicKey = generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' }).toString();
const actor: IActor = {
	id: uri, type: 'Person', preferredUsername: 'alice', inbox: `${uri}/inbox`, outbox: `${uri}/outbox`,
	assertionMethod: [{ id: keyId, type: 'Multikey', controller: uri, publicKeyMultibase: encodeActorPublicMultikey(publicKey) }],
};
const note: IObject = { id: 'https://author.example/notes/1', type: 'Note', attributedTo: uri, content: 'synthetic note' };

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>(r => { resolve = r; });
	return { promise, resolve };
}

function fixture() {
	const logger = mock<Logger>();
	const rows = new Map<string, MiRemoteUser>();
	const profiles = new Map<string, MiUserProfile>();
	const keys = new Map<string, { userId: string; keyId: string; keyPem: string }>();
	const cache = new Map<string, MiRemoteUser>();
	const published: string[] = [];
	const cacheSet = vi.fn((id: string, user: MiRemoteUser) => {
		expect(profiles.has(user.id)).toBe(true);
		expect(keys.get(keyId)?.userId).toBe(user.id);
		published.push(id);
		cache.set(id, user);
	});
	const control: { failAt?: 'profile' | 'key'; beforeKey?: () => Promise<void> } = {};
	let serial = Promise.resolve();
	let nextId = 0;
	// Model READ COMMITTED visibility and serialized uniqueness checks. This is
	// a repository mock, not evidence about a live PostgreSQL race or rollback.
	const transaction = vi.fn(async (run: (manager: EntityManager) => Promise<unknown>) => {
		const previous = serial;
		const release = deferred();
		serial = release.promise;
		await previous;
		const pendingRows = new Map(rows), pendingProfiles = new Map(profiles), pendingKeys = new Map(keys);
		const manager = mock<EntityManager>();
		manager.save.mockImplementation(async (entity: unknown) => {
			if (entity instanceof MiUser) {
				if (pendingRows.has(uri)) throw new QueryFailedError('INSERT user', [], Object.assign(new Error('duplicate'), { code: '23505' }));
				pendingRows.set(uri, entity as MiRemoteUser);
			} else if (entity instanceof MiUserProfile) {
				if (control.failAt === 'profile') throw new Error('profile write failed');
				pendingProfiles.set(entity.userId, entity);
			}
			return entity;
		});
		manager.findOneOrFail.mockImplementation(async () => pendingRows.get(uri)!);
		manager.query.mockImplementation(async (_sql, args) => {
			await control.beforeKey?.();
			if (control.failAt === 'key') throw new Error('key write failed');
			const [id, userId, pem] = args as string[];
			pendingKeys.set(id, { keyId: id, userId, keyPem: pem });
			return [];
		});
		try {
			const result = await run(manager);
			for (const [id, row] of pendingRows) rows.set(id, row);
			for (const [id, row] of pendingProfiles) profiles.set(id, row);
			for (const [id, row] of pendingKeys) keys.set(id, row);
			return result;
		} finally { release.resolve(); }
	});
	const lookup = vi.fn(async () => rows.get(uri) ?? null);
	const repository = { findOneBy: lookup, update: async () => ({ affected: 1 }) };
	const utility = {
		punyHost: (value: string) => new URL(value).host, toPuny: (host: string) => host,
		isUriLocal: () => false, extractDbHost: (value: string) => new URL(value).hostname,
		isFederationAllowedUri: () => true,
	};
	const factory = { createResolver: vi.fn(async () => {
		const resolver = mock<Resolver>();
		resolver.resolve.mockImplementation(async value => typeof value !== 'string' ? value : structuredClone(value === uri ? actor : note));
		return resolver;
	}) };
	const person: ApPersonService = Object.assign(Object.create(ApPersonService.prototype), {
		logger, config: { host: 'local.example', url: 'https://local.example' }, meta: {}, utilityService: utility,
		usersRepository: repository, db: { transaction }, cacheService: { uriPersonCache: { get: (id: string) => cache.get(id), set: cacheSet } },
		apResolverService: factory, idService: { gen: () => `author-${++nextId}` },
		apNoteService: { extractEmojis: async () => [] }, userEntityService: { isRemoteUser: () => true },
		usersChart: { update: vi.fn() }, hashtagService: { updateUsertags: vi.fn() },
	});
	Object.defineProperty(person, 'resolveAvatarAndBanner', { value: async () => ({}) });
	Object.defineProperty(person, 'updateFeatured', { value: async () => undefined });
	const show: RemoteUserResolveService = Object.assign(Object.create(RemoteUserResolveService.prototype), {
		config: { host: 'local.example' }, logger, utilityService: utility, usersRepository: repository,
		webfingerService: { webfinger: vi.fn(async () => ({ links: [{ rel: 'self', href: uri }] })) }, apPersonService: person,
	});
	const keyRead = vi.fn(async (id: string) => {
		expect(profiles.has(id)).toBe(true);
		return [...keys.values()].filter(key => key.userId === id);
	});
	const auth: ApDbResolverService = Object.assign(Object.create(ApDbResolverService.prototype), {
		logger, utilityService: utility, apPersonService: person,
		publicKeyByUserIdCache: { fetch: keyRead },
	});
	const created = vi.fn(async (_user: unknown, data: { uri: string }) => mock<MiNote>({ id: 'synthetic-note', uri: data.uri, hasPoll: false }));
	const noteService: ApNoteService = Object.assign(Object.create(ApNoteService.prototype), {
		logger, utilityService: utility, apResolverService: factory, apPersonService: person,
		apDbResolverService: { getNoteFromApId: async () => null },
		apMentionService: { extractApMentionObjects: () => [], extractApMentions: async () => [] },
		apMfmService: { htmlToMfm: (s: string) => s }, apQuestionService: { extractPollFromQuestion: async () => undefined },
		apAudienceService: { parseAudience: async () => ({ visibility: 'public', visibleUsers: [] }) },
		emojisRepository: { findBy: async () => [] }, noteCreateService: { checkProhibitedWordsContain: () => false, create: created },
	});
	const inbox: ApInboxService = Object.assign(Object.create(ApInboxService.prototype), {
		logger, utilityService: utility, apResolverService: factory, apPersonService: person, apNoteService: noteService,
		userEntityService: { isSuspendedEither: () => false }, relayService: { isRelayActor: async () => false },
		noteEntityService: { isVisibleForMe: async () => true }, noteCreateService: { create: created },
		apAudienceService: { parseAudience: async () => ({ visibility: 'public', visibleUsers: [] }) },
	});
	const announcer = mock<MiRemoteUser>({ id: 'announcer', uri: 'https://relay.example/users/bob', lastFetchedAt: new Date(), isSuspended: false, isRemoteSuspended: false });
	const announce = { type: 'Announce', id: 'https://relay.example/activities/1', actor: announcer.uri, object: note.id };
	return { person, show, auth, inbox, announcer, announce, rows, profiles, keys, published, control, keyRead, created };
}

describe('unknown Actor initialization before users/show', () => {
	test('an Announce registers its unknown Note author with profile and keys before caching or creating the Note', async () => {
		const f = fixture();
		await f.inbox.performActivity(f.announcer, f.announce);
		expect(f.rows.size).toBe(1);
		expect(f.profiles.size).toBe(1);
		expect(f.keys.size).toBe(1);
		expect(f.created).toHaveBeenCalledTimes(2);
		await expect(f.show.resolveUser('alice', 'author.example')).resolves.toBe(f.rows.get(uri));
	});

	test.each(['profile', 'key'] as const)('does not publish partial state after a %s write failure', async failAt => {
		const f = fixture();
		f.control.failAt = failAt;
		await expect(f.person.resolvePerson(uri)).rejects.toThrow(`${failAt} write failed`);
		expect([f.rows.size, f.profiles.size, f.keys.size]).toEqual([0, 0, 0]);
		expect(f.published).toEqual([]);
		f.control.failAt = undefined;
		await expect(f.show.resolveUser('alice', 'author.example')).resolves.toMatchObject({ uri });
		expect([f.rows.size, f.profiles.size, f.keys.size]).toEqual([1, 1, 1]);
	});

	test('a later Note failure retains a fully initialized author that users/show can read', async () => {
		const f = fixture();
		const failure = new Error('note write failed');
		f.created.mockRejectedValueOnce(failure);
		await expect(f.inbox.performActivity(f.announcer, f.announce)).rejects.toBe(failure);
		expect([f.rows.size, f.profiles.size, f.keys.size]).toEqual([1, 1, 1]);
		await expect(f.show.resolveUser('alice', 'author.example')).resolves.toBe(f.rows.get(uri));
	});

	test('key discovery racing with users/show does not expose a half-initialized Actor', async () => {
		const f = fixture();
		const entered = deferred(), resume = deferred();
		f.control.beforeKey = async () => { entered.resolve(); await resume.promise; };
		const discovering = f.auth.getAuthUserFromApId(uri, keyId);
		await entered.promise;
		expect([f.rows.size, f.profiles.size, f.keys.size]).toEqual([0, 0, 0]);
		expect(f.keyRead).not.toHaveBeenCalled();
		const showing = f.show.resolveUser('alice', 'author.example');
		resume.resolve();
		const [auth, user] = await Promise.all([discovering, showing]);
		expect(auth?.user?.id).toBe(user.id);
		expect(auth?.key?.keyId).toBe(keyId);
		expect([f.rows.size, f.profiles.size, f.keys.size]).toEqual([1, 1, 1]);
	});
});
