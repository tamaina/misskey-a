/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ChannelFederationService } from '../../backend/services/ChannelFederationService.js';
import { ApNoteService } from '@features/federation/backend/services/ApNoteService.js';
import { ApInboxService } from '@features/federation/backend/services/ApInboxService.js';
import { createApShowProcedure } from '@features/federation/backend/endpoints/ap/show.js';
import type { ApiServices } from '@features/api/backend/transport/context.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { MiChannel } from '../../backend/models/Channel.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import type { IActor, IAnnounce, ICreate, IObject, IPost } from '@features/federation/backend/protocol/type.js';
import type { ApResolverService, Resolver } from '@features/federation/backend/services/ApResolverService.js';
import type { ChannelsRepository, ChannelFollowingsRepository, UsersRepository, NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { ModuleRef } from '@nestjs/core';
import type * as Redis from 'ioredis';

const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';
const groupUri = 'https://a.test/channels/group';
const authorUri = 'https://a.test/users/author';
const noteUri = 'https://a.test/notes/note';

/** Network and persistence are bounded fakes; the Note, Group proof and inbox methods are real. */
function fixture() {
	const group = { type: 'Group', id: groupUri, _misskey_channel: true, name: 'Remote channel' } as IActor;
	const note: IPost = { type: 'Note', id: noteUri, attributedTo: authorUri, audience: groupUri, to: [PUBLIC], content: 'approved' };
	const create: ICreate = { type: 'Create', id: `${noteUri}/activity`, actor: authorUri, audience: groupUri, to: [PUBLIC], object: structuredClone(note) };
	const approval: IAnnounce = { type: 'Announce', id: `${groupUri}/activities/note`, actor: groupUri, audience: groupUri, to: [PUBLIC], object: structuredClone(create) };
	const objects = new Map<string, IObject>([[groupUri, group], [noteUri, note], [create.id!, create], [approval.id!, approval]]);
	const requests: string[] = [];
	const blocked = new Set<string>();
	const resolvers = mockDeep<ApResolverService>();
	resolvers.createResolver.mockImplementation(async () => {
		const history = new Set<string>();
		return {
			resolve: async (value: string | IObject) => {
				if (typeof value !== 'string') return value;
				if (blocked.has(new URL(value).origin)) throw new Error('blocked host');
				if (history.has(value)) throw new Error('duplicate resolver history');
				history.add(value);
				requests.push(value);
				const object = objects.get(value);
				if (!object) throw new Error(`unexpected request: ${value}`);
				return structuredClone(object);
			},
			getHistory: () => [...history],
		} as Resolver;
	});
	const redis = mockDeep<Redis.Redis>();
	const locks = new Map<string, string>();
	redis.set.mockImplementation(async (key, value) => {
		if (locks.has(String(key))) return null;
		locks.set(String(key), String(value));
		return 'OK';
	});
	redis.get.mockImplementation(async key => locks.get(String(key)) ?? null);
	redis.del.mockImplementation(async key => Number(locks.delete(String(key))));
	const channels = mockDeep<ChannelsRepository>();
	const savedChannels = new Map<string, MiChannel>();
	channels.findOneBy.mockImplementation(async where => {
		const query = Array.isArray(where) ? where[0] : where;
		return typeof query.uri === 'string' ? savedChannels.get(query.uri) ?? null : null;
	});
	channels.findOneByOrFail.mockImplementation(async where => savedChannels.get(String((Array.isArray(where) ? where[0] : where).uri))!);
	const builder = { insert: vi.fn(), values: vi.fn(), orIgnore: vi.fn(), execute: vi.fn(async () => ({})) };
	channels.createQueryBuilder.mockReturnValue(builder as never);
	builder.insert.mockReturnValue(builder);
	builder.values.mockImplementation((channel: MiChannel) => {
		if (!savedChannels.has(channel.uri!)) savedChannels.set(channel.uri!, channel);
		return builder;
	});
	builder.orIgnore.mockReturnValue(builder);
	const savedNotes = new Map<string, MiNote>();
	const notes = mockDeep<NotesRepository>();
	notes.existsBy.mockImplementation(async where => savedNotes.has(String((Array.isArray(where) ? where[0] : where).uri)));
	const groupActor = mockDeep<MiRemoteUser>({ id: 'group', host: 'a.test', uri: groupUri, username: 'group', isSuspended: false, isRemoteSuspended: false });
	const author = mockDeep<MiRemoteUser>({ id: 'author', host: 'a.test', uri: authorUri, username: 'author', isSuspended: false, isRemoteSuspended: false });
	const people = {
		fetchPerson: vi.fn(async (uri: string) => uri === authorUri ? author : groupActor),
		resolvePerson: vi.fn(async (uri: string) => uri === authorUri ? author : groupActor),
	};
	const moduleRef = mockDeep<ModuleRef>();
	const followings = mockDeep<FollowingsRepository>();
	const channelFollowings = mockDeep<ChannelFollowingsRepository>();
	const queue = { deliver: vi.fn(), deliverMany: vi.fn() };
	const events = { publishInternalEvent: vi.fn() };
	const service = new ChannelFederationService({ url: 'https://c.test' } as never, redis, channels, channelFollowings, mockDeep<UsersRepository>(), notes, followings, { gen: () => 'remote-channel' } as never, events as never, queue as never, mockDeep(), resolvers, moduleRef);
	const noteCreate = vi.fn(async (user: MiRemoteUser, data: { uri: string; channel?: MiChannel; renote?: MiNote; visibility: string }, _silent?: boolean) => {
		if (savedNotes.has(data.uri)) throw Object.assign(new Error('duplicate'), { name: 'duplicated' });
		const saved = { id: `saved-${savedNotes.size}`, uri: data.uri, channelId: data.channel?.id ?? null, userId: user.id, userHost: user.host, user, renote: data.renote, visibility: data.visibility, localOnly: false } as unknown as MiNote;
		savedNotes.set(data.uri, saved);
		return saved;
	});
	const audience = { parseAudience: vi.fn(async () => ({ visibility: 'public', visibleUsers: [] })) };
	const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
	const utility = { extractDbHost: (uri: string) => new URL(uri).host, isFederationAllowedUri: (uri: string) => !blocked.has(new URL(uri).origin), isUriLocal: () => false, isSelfHost: () => false };
	const importer = Object.setPrototypeOf({
		config: { url: 'https://c.test' }, meta: {}, redisClient: redis, moduleRef, logger,
		utilityService: utility, idService: { isSafeT: () => true }, apResolverService: resolvers, apPersonService: people,
		apDbResolverService: { getNoteFromApId: async (value: string | IObject) => savedNotes.get(typeof value === 'string' ? value : value.id!) ?? null },
		apMentionService: { extractApMentionObjects: () => [], extractApMentions: async () => [] },
		apMfmService: { htmlToMfm: (value: string) => value }, apQuestionService: { extractPollFromQuestion: async () => undefined },
		apAudienceService: audience, extractEmojis: async () => [], noteCreateService: { create: noteCreate, checkProhibitedWordsContain: () => false },
	}, ApNoteService.prototype) as ApNoteService;
	moduleRef.get.mockImplementation(token => (token === 'ApPersonService' ? people : token === 'ApNoteService' ? importer : service) as never);
	const inbox = Object.assign(Object.create(ApInboxService.prototype), {
		channelFederationService: service, apResolverService: resolvers, apNoteService: importer,
		redisClient: redis, relayService: { isRelayActor: async () => false }, utilityService: utility, logger,
		apAudienceService: audience, noteCreateService: { create: noteCreate }, noteEntityService: { isVisibleForMe: async () => true },
	}) as { announce(actor: MiRemoteUser, activity: IAnnounce): Promise<string | void> };
	return { service, importer, inbox, channels, savedChannels, savedNotes, noteCreate, note, create, approval, group, author, groupActor, people, objects, requests, resolvers, blocked, redis, locks, followings, channelFollowings, queue, events, utility };
}

function assertNoSubscription(f: ReturnType<typeof fixture>) {
	expect(f.followings.save).not.toHaveBeenCalled();
	expect(f.channelFollowings.upsert).not.toHaveBeenCalled();
	expect(f.queue.deliver).not.toHaveBeenCalled();
	expect(f.queue.deliverMany).not.toHaveBeenCalled();
	expect(f.events.publishInternalEvent).not.toHaveBeenCalled();
	expect(f.requests.some(uri => /\/(outbox|following|followers)(\/|$)/.test(new URL(uri).pathname))).toBe(false);
}

test('a fetched public reference verifies an unknown Group without re-entering its Note lock', async () => {
	const f = fixture();
	f.note['@context'] = 'https://www.w3.org/ns/activitystreams';
	const receive = vi.spyOn(f.service, 'receiveAnnounce');
	const result = await f.importer.resolveNote(noteUri);
	expect(result).toMatchObject({ uri: noteUri, channelId: 'remote-channel', userId: 'author' });
	expect(f.savedChannels.size).toBe(1);
	expect(f.redis.set.mock.calls.filter(([key]) => key === `lock:ap-object:${noteUri}`)).toHaveLength(1);
	expect(receive).not.toHaveBeenCalled();
	await vi.waitFor(() => expect(f.locks.size).toBe(0));
	assertNoSubscription(f);
});

test('ordinary B Announce imports A membership on previously unsubscribed C and keeps the wrapper outside the channel', async () => {
	const f = fixture();
	const bob = mockDeep<MiRemoteUser>({ id: 'bob', uri: 'https://b.test/users/bob', host: 'b.test', isSuspended: false, isRemoteSuspended: false });
	const announce: IAnnounce = { type: 'Announce', id: 'https://b.test/notes/renote', actor: bob.uri, object: noteUri, to: [PUBLIC] };
	await f.inbox.announce(bob, announce);
	expect(f.savedNotes.get(announce.id!)).toMatchObject({ channelId: null, userId: 'bob', renote: { uri: noteUri, channelId: 'remote-channel', userId: 'author' } });
	expect(f.noteCreate.mock.calls[0][2]).toBe(true);
	expect(f.noteCreate.mock.calls[1][2]).toBeUndefined();
	assertNoSubscription(f);
});

test('the real ap/show procedure can acquire a public Note before resolving or following its Group', async () => {
	const f = fixture();
	const serializer = mockDeep<NoteEntityService>();
	serializer.pack.mockResolvedValue({ id: 'saved-0', uri: noteUri, userId: 'author', channelId: 'remote-channel', user: { id: 'author', username: 'author', host: 'a.test', avatarUrl: null, avatarDecorations: [], emojis: {} }, fileIds: [], reactionEmojis: {}, reactions: {} } as never);
	const services = mockDeep<ApiServices>();
	services.authenticate.mockResolvedValue([{ id: 'viewer', isSuspended: false, movedToUri: null }, null]);
	services.limitActor.mockReturnValue(null);
	const client = createProcedureClient(createApShowProcedure({ utilityService: f.utility, userEntityService: mockDeep(), noteEntityService: serializer, apResolverService: f.resolvers, apDbResolverService: { getUserFromApId: async () => null, getNoteFromApId: async () => null }, apPersonService: mockDeep(), apNoteService: f.importer }), { context: { services, credential: 'fixture', ip: '127.0.0.1', headers: {} } });
	expect(await client({ uri: noteUri })).toMatchObject({ type: 'Note', object: { channelId: 'remote-channel', userId: 'author' } });
	assertNoSubscription(f);
});

test('concurrent ordinary resolution and direct acquisition/replay keep one Note and one channel URI', async () => {
	const f = fixture();
	const result = await Promise.all([f.importer.resolveNote(noteUri), f.importer.createNote(noteUri), f.importer.resolveNote(noteUri)]);
	expect(new Set(result.map(note => note?.id)).size).toBe(1);
	await f.importer.resolveNote(noteUri);
	expect(f.savedNotes.size).toBe(1);
	expect(f.savedChannels.size).toBe(1);
	assertNoSubscription(f);
});

test.each(['group-type', 'group-marker', 'group-id', 'group-suspended', 'actor-suspended', 'author-suspended', 'announce-actor', 'announce-id', 'announce-audience', 'announce-private', 'create-actor', 'create-id', 'create-audience', 'create-private', 'note-id', 'note-author', 'note-audience', 'note-private', 'canonical-tamper', 'fetched-tamper', 'remote-submission', 'blocked', 'missing-approval'])('unproven membership fails closed without saving Note/channel: %s', async reason => {
	const f = fixture();
	const inner = f.approval.object as ICreate;
	const approved = inner.object as IPost;
	if (reason === 'group-type') f.group.type = 'Person';
	if (reason === 'group-marker') f.group._misskey_channel = false;
	if (reason === 'group-id') f.group.id = 'https://a.test/channels/other';
	if (reason === 'group-suspended') f.group.suspended = true;
	if (reason === 'actor-suspended') f.groupActor.isSuspended = true;
	if (reason === 'author-suspended') f.author.isRemoteSuspended = true;
	if (reason === 'announce-actor') f.approval.actor = authorUri;
	if (reason === 'announce-id') f.approval.id = `${groupUri}/activities/other`;
	if (reason === 'announce-audience') f.approval.audience = authorUri;
	if (reason === 'announce-private') f.approval.to = [groupUri];
	if (reason === 'create-actor') inner.actor = groupUri;
	if (reason === 'create-id') inner.id = 'https://other.test/create';
	if (reason === 'create-audience') inner.audience = authorUri;
	if (reason === 'create-private') inner.to = [groupUri];
	if (reason === 'note-id') approved.id = 'https://a.test/notes/other';
	if (reason === 'note-author') approved.attributedTo = groupUri;
	if (reason === 'note-audience') approved.audience = authorUri;
	if (reason === 'note-private') f.note.to = [groupUri];
	if (reason === 'canonical-tamper') (f.create.object as IPost).content = 'forged';
	if (reason === 'fetched-tamper') f.note.content = 'forged';
	if (reason === 'remote-submission') inner.actor = 'https://other.test/users/author';
	if (reason === 'blocked') f.blocked.add('https://a.test');
	if (reason === 'missing-approval') f.objects.delete(f.approval.id!);
	await f.importer.createNote(noteUri).catch(() => null);
	expect(f.noteCreate).not.toHaveBeenCalled();
	expect(f.savedNotes.size).toBe(0);
	expect(f.savedChannels.size).toBe(0);
	assertNoSubscription(f);
});

test.each([PUBLIC, authorUri, 'https://a.test/users/author/followers', [PUBLIC, authorUri], { type: 'Collection', id: 'https://a.test/audience' }].map(audience => ({ audience })))('ordinary non-channel audience remains an author Note: %j', async ({ audience }) => {
	const f = fixture();
	f.note.audience = audience;
	expect(await f.importer.createNote(noteUri)).toMatchObject({ uri: noteUri, channelId: null, userId: 'author' });
	expect(f.savedChannels.size).toBe(0);
	expect(f.requests).toEqual([noteUri]);
	assertNoSubscription(f);
});

test('a known channel still requires canonical Group approval during ordinary acquisition', async () => {
	const f = fixture();
	f.savedChannels.set(groupUri, { id: 'existing-channel', uri: groupUri, host: 'a.test' } as MiChannel);
	expect(await f.importer.resolveNote(noteUri)).toMatchObject({ channelId: 'existing-channel' });
	expect(f.requests).toContain(f.approval.id!);
	expect(f.savedChannels.size).toBe(1);
	assertNoSubscription(f);
});

test.each(['inReplyTo', '_misskey_quote'] as const)('ordinary acquisition verifies an unseen public Group reference: %s', async reference => {
	const f = fixture();
	const parentUri = 'https://a.test/notes/parent';
	const parent: IPost = { ...structuredClone(f.note), id: parentUri };
	const parentCreate: ICreate = { ...structuredClone(f.create), id: `${parentUri}/activity`, object: parent };
	const parentApproval: IAnnounce = { ...structuredClone(f.approval), id: `${groupUri}/activities/parent`, object: parentCreate };
	f.objects.set(parentUri, parent);
	f.objects.set(parentCreate.id!, parentCreate);
	f.objects.set(parentApproval.id!, parentApproval);
	f.note[reference] = parentUri;
	f.create.object = structuredClone(f.note);
	f.approval.object = structuredClone(f.create);
	expect(await f.importer.resolveNote(noteUri)).toMatchObject({ uri: noteUri, channelId: 'remote-channel' });
	expect(f.savedNotes.size).toBe(2);
	expect(f.savedNotes.get(parentUri)).toMatchObject({ channelId: 'remote-channel', userId: 'author' });
	expect(f.savedChannels.size).toBe(1);
	assertNoSubscription(f);
});
