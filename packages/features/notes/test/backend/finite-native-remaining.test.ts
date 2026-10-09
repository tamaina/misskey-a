/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { ModuleRef } from '@nestjs/core';
import { EntityNotFoundError } from 'typeorm';
import { notesApiContract } from '../../backend/api.contract.js';
import { notesContract } from '../../backend/endpoints/notes.contract.js';
import { notesConversationContract } from '../../backend/endpoints/notes/conversation.contract.js';
import { notesDraftsListContract } from '../../backend/endpoints/notes/drafts/list.contract.js';
import { notesPollsRecommendationContract } from '../../backend/endpoints/notes/polls/recommendation.contract.js';
import { notesReactionsContract } from '../../backend/endpoints/notes/reactions.contract.js';
import { notesReactionsDeleteContract } from '../../backend/endpoints/notes/reactions/delete.contract.js';
import { notesCreateContract } from '../../backend/endpoints/notes/create.contract.js';
import { notesDraftsCreateContract } from '../../backend/endpoints/notes/drafts/create.contract.js';
import { notesDraftsUpdateContract } from '../../backend/endpoints/notes/drafts/update.contract.js';
import { packedNoteDraftSchema, packedNoteReactionSchema, packedNoteReactionWithNoteSchema } from '../../backend/note-aux.schema.js';
import { NoteDraftEntityService } from '../../backend/serializers/NoteDraftEntityService.js';
import { NoteReactionEntityService } from '../../backend/serializers/NoteReactionEntityService.js';
import { NotesCreateOperation as CreateOperation } from '../../backend/endpoints/notes/create.js';
import { NotesDraftsCreateOperation as DraftCreateOperation } from '../../backend/endpoints/notes/drafts/create.js';
import { NotesDraftsUpdateOperation as DraftUpdateOperation } from '../../backend/endpoints/notes/drafts/update.js';
import { MiNoteDraft } from '../../backend/models/NoteDraft.js';
import type { NoteEntityService } from '../../backend/serializers/NoteEntityService.js';
import type { NoteDraftService } from '../../backend/services/NoteDraftService.js';
import type { NoteCreateService } from '../../backend/services/NoteCreateService.js';
import type { ReactionService } from '../../backend/services/ReactionService.js';
import type { MiNoteReaction } from '../../backend/models/NoteReaction.js';
import type { MiNote } from '../../backend/models/Note.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiChannel } from '@features/channels/backend/models/Channel.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Packed } from '@features/index/backend/packed.schema.js';
import type { ChannelsRepository, NoteDraftsRepository, NoteReactionsRepository } from '@features/persistence/backend/repositories/models.js';

const user: Packed<'UserLite'> = {
	id: 'user123', name: null, username: 'tester', host: null,
	avatarUrl: 'https://example.com/avatar.png', avatarBlurhash: null,
	avatarDecorations: [], emojis: {}, onlineStatus: 'unknown',
};
const note: Packed<'Note'> = {
	id: 'note123', createdAt: '2026-01-01T00:00:00.000Z', text: 'hello', userId: user.id, user,
	visibility: 'public', reactionAcceptance: null, reactionEmojis: {}, reactions: {},
	reactionCount: 0, renoteCount: 0, repliesCount: 0,
};

function draftFixture(): MiNoteDraft {
	return Object.assign(new MiNoteDraft(), {
		id: 'draft123', userId: user.id, user: null, text: null, cw: null,
		visibility: 'public', localOnly: false, reactionAcceptance: null, visibleUserIds: [],
		fileIds: [], hashtag: null, replyId: null, renoteId: null, channelId: null,
		hasPoll: false, pollChoices: [], pollMultiple: false, pollExpiresAt: null,
		pollExpiredAfter: null, scheduledAt: null, isActuallyScheduled: false,
	});
}

function draftProducer() {
	const moduleRef = mockDeep<ModuleRef>();
	const users = mockDeep<UserEntityService>();
	const files = mockDeep<DriveFileEntityService>();
	const ids = mockDeep<IdService>();
	const notes = mockDeep<NoteEntityService>();
	const channels = mockDeep<ChannelsRepository>();
	users.pack.mockResolvedValue(user);
	files.packManyByIds.mockResolvedValue([]);
	ids.parse.mockReturnValue({ date: new Date(note.createdAt) });
	notes.pack.mockResolvedValue(note);
	moduleRef.get.mockReturnValueOnce(users).mockReturnValueOnce(files).mockReturnValueOnce(ids).mockReturnValueOnce(notes);
	const serializer = new NoteDraftEntityService(moduleRef, mockDeep<NoteDraftsRepository>(), channels);
	serializer.onModuleInit();
	return { serializer, notes, channels };
}

test('all 28 migrated inputs strip transport keys, reject arrays and retain native defaults', () => {
	const { delete: _deletePilot, ...migrated } = notesApiContract;
	const inputs = Object.values(migrated).map(contract => contract['~orpc'].inputSchema);
	expect(inputs).toHaveLength(28);
	const fields = { noteIds: ['note123'], noteId: 'note123', draftId: 'draft123', userId: 'user123', reaction: '❤️', choice: -1, expiresAt: -1, text: 'hello', targetLang: 'en', future: true, i: 'transport' };
	for (const input of inputs) {
		if (input === undefined) throw new Error('Migrated note contract must declare an input schema');
		const parsed = v.parse(input, fields);
		expect(parsed).not.toHaveProperty('future');
		expect(parsed).not.toHaveProperty('i');
		expect(v.safeParse(input, []).success).toBe(false);
		expect(v.safeParse(input, Object.assign([], fields)).success).toBe(false);
	}
	expect(v.safeParse(requiredSchema(notesReactionsDeleteContract['~orpc'].inputSchema), {}).success).toBe(false);
	expect(v.safeParse(requiredSchema(notesReactionsDeleteContract['~orpc'].inputSchema), { noteId: 'bad-id' }).success).toBe(false);
	expect(v.parse(requiredSchema(notesContract['~orpc'].inputSchema), {})).toEqual({ local: false, limit: 10 });
	expect(v.parse(requiredSchema(notesConversationContract['~orpc'].inputSchema), { noteId: note.id })).toEqual({ noteId: note.id, limit: 10, offset: 0 });
	expect(v.parse(requiredSchema(notesDraftsListContract['~orpc'].inputSchema), { scheduled: null })).toEqual({ limit: 30, scheduled: null });
	expect(v.parse(requiredSchema(notesPollsRecommendationContract['~orpc'].inputSchema), {})).toEqual({ limit: 10, offset: 0, excludeChannels: false });
	expect(v.parse(requiredSchema(notesReactionsContract['~orpc'].inputSchema), { noteId: note.id, type: null })).toEqual({ noteId: note.id, limit: 10, type: null });
	for (const limit of [0, 101, 1.5, '10', null]) expect(v.safeParse(requiredSchema(notesContract['~orpc'].inputSchema), { limit }).success).toBe(false);
	expect(v.safeParse(requiredSchema(notesContract['~orpc'].inputSchema), { reply: undefined }).success).toBe(false);
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesReactionsDeleteContract['~orpc']['inputSchema']>>>().toEqualTypeOf<{ noteId: string }>();
	expectTypeOf<v.InferOutput<typeof packedNoteReactionSchema>>().toEqualTypeOf<{ id: string; createdAt: string; user: Packed<'UserLite'>; type: string }>();
});

test.each([false, true])('actual draft producer supports poll/channel and detail=%s', async detail => {
	const { serializer, channels } = draftProducer();
	const draft = draftFixture();
	const empty = await serializer.pack(draft, null, { detail });
	expect(v.parse(packedNoteDraftSchema, empty)).toEqual(empty);
	expect(empty.poll).toBeNull();
	expect(Object.hasOwn(empty, 'channel')).toBe(true);
	expect(empty.channel).toBeUndefined();
	expect(Object.hasOwn(empty, 'reply')).toBe(detail);
	expect(Object.hasOwn(empty, 'renote')).toBe(detail);
	if (detail) { expect(empty.reply).toBeUndefined(); expect(empty.renote).toBeUndefined(); }
	draft.hasPoll = true;
	draft.pollChoices = ['one', 'two'];
	draft.pollExpiredAfter = 300;
	draft.channelId = 'channel123';
	draft.channel = null;
	const channel = mockDeep<MiChannel>({ id: draft.channelId, name: 'channel', color: '#000000', isSensitive: false, allowRenoteToExternal: true, userId: user.id });
	channels.findOneBy.mockResolvedValue(channel);
	const populated = await serializer.pack(draft, null, { detail });
	expect(populated.poll).toEqual({ choices: ['one', 'two'], multiple: false, expiresAt: undefined, expiredAfter: 300 });
	expect(v.parse(packedNoteDraftSchema, populated)).toEqual(populated);
	expect(populated.channel).toEqual({ id: channel.id, name: channel.name, color: channel.color, isSensitive: false, allowRenoteToExternal: true, userId: user.id });
	for (const invalid of [
		{ ...populated, future: true }, { ...populated, text: 7 },
		{ ...populated, poll: { ...populated.poll, future: true } },
		{ ...populated, poll: { choices: [], multiple: 'wrong' } },
		{ ...populated, poll: { choices: [] } },
		{ ...populated, channel: { ...populated.channel, future: true } },
		{ ...populated, channel: { ...populated.channel, name: 7 } },
		{ ...populated, channel: { id: channel.id } },
	]) expect(v.safeParse(packedNoteDraftSchema, invalid).success).toBe(false);
	const { userId: omitted, ...missing } = populated;
	expect(omitted).toBe(user.id);
	expect(v.safeParse(packedNoteDraftSchema, missing).success).toBe(false);
	draft.pollExpiresAt = new Date(note.createdAt);
	draft.pollExpiredAfter = null;
	draft.channel = channel;
	const attached = await serializer.pack(draft, null, { detail });
	expect(attached.poll?.expiresAt).toBe(note.createdAt);
	expect(v.parse(packedNoteDraftSchema, attached)).toEqual(attached);
	channels.findOneBy.mockResolvedValue(null);
	draft.channel = null;
	expect((await serializer.pack(draft)).channel).toBeUndefined();
});

test('actual draft producer resolves present references and converts missing references to null', async () => {
	const { serializer, notes } = draftProducer();
	const draft = draftFixture();
	draft.replyId = 'reply123'; draft.renoteId = 'renote123';
	const present = await serializer.pack(draft);
	expect(present.reply).toBe(note); expect(present.renote).toBe(note);
	expect(v.parse(packedNoteDraftSchema, present)).toEqual(present);
	expect(notes.pack).toHaveBeenCalledWith(draft.replyId, undefined, { detail: false, skipHide: undefined });
	expect(notes.pack).toHaveBeenCalledWith(draft.renoteId, undefined, { detail: true, skipHide: undefined });
	notes.pack.mockRejectedValue(new EntityNotFoundError('Note', {}));
	const missing = await serializer.pack(draft);
	expect(missing.reply).toBeNull(); expect(missing.renote).toBeNull();
	expect(v.parse(packedNoteDraftSchema, missing)).toEqual(missing);
});

test('both actual reaction serializers emit closed finite results', async () => {
	const moduleRef = mockDeep<ModuleRef>();
	const users = mockDeep<UserEntityService>();
	const notes = mockDeep<NoteEntityService>();
	const reactions = mockDeep<ReactionService>();
	const ids = mockDeep<IdService>();
	users.pack.mockResolvedValue(user); notes.pack.mockResolvedValue(note);
	reactions.convertLegacyReaction.mockReturnValue('❤️'); ids.parse.mockReturnValue({ date: new Date(note.createdAt) });
	moduleRef.get.mockReturnValueOnce(users).mockReturnValueOnce(notes).mockReturnValueOnce(reactions).mockReturnValueOnce(ids);
	const serializer = new NoteReactionEntityService(moduleRef, mockDeep<NoteReactionsRepository>());
	serializer.onModuleInit();
	const reaction = mockDeep<MiNoteReaction>({ id: 'reaction123', userId: user.id, noteId: note.id, user: null, note: null, reaction: 'like' });
	const plain = await serializer.pack(reaction);
	const withNote = await serializer.packWithNote(reaction);
	expect(plain).toEqual({ id: reaction.id, createdAt: note.createdAt, user, type: '❤️' });
	expect(withNote).toEqual({ ...plain, note });
	expect(v.parse(packedNoteReactionSchema, plain)).toEqual(plain);
	expect(v.parse(packedNoteReactionWithNoteSchema, withNote)).toEqual(withNote);
	for (const value of [{ ...plain, future: true }, { ...plain, type: 7 }, { id: plain.id, createdAt: plain.createdAt, user }]) expect(v.safeParse(packedNoteReactionSchema, value).success).toBe(false);
	for (const value of [{ ...withNote, future: true }, { ...withNote, type: 7 }, plain, { ...withNote, note: null }]) expect(v.safeParse(packedNoteReactionWithNoteSchema, value).success).toBe(false);
});

test('actual create and draft handlers emit the three closed envelopes', async () => {
	const { serializer } = draftProducer();
	const draft = draftFixture();
	const packedDraft = await serializer.pack(draft);
	const drafts = mockDeep<NoteDraftService>();
	const draftSerializer = mockDeep<NoteDraftEntityService>();
	drafts.create.mockResolvedValue(draft); drafts.update.mockResolvedValue(draft);
	draftSerializer.pack.mockResolvedValue(packedDraft);
	const notes = mockDeep<NoteEntityService>();
	const create = mockDeep<NoteCreateService>();
	const model = mockDeep<MiNote>({ id: note.id });
	create.fetchAndCreate.mockResolvedValue(model); notes.pack.mockResolvedValue(note);
	const me = mockDeep<MiLocalUser>({ id: user.id });
	const created = await new CreateOperation(notes, create).execute(v.parse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'hello' }), me);
	const createdDraft = await new DraftCreateOperation(drafts, draftSerializer).execute(v.parse(requiredSchema(notesDraftsCreateContract['~orpc'].inputSchema), {}), me);
	const updatedDraft = await new DraftUpdateOperation(drafts, draftSerializer).execute(v.parse(requiredSchema(notesDraftsUpdateContract['~orpc'].inputSchema), { draftId: draft.id }), me);
	expect(created).toEqual({ createdNote: note });
	expect(createdDraft).toEqual({ createdDraft: packedDraft });
	expect(updatedDraft).toEqual({ updatedDraft: packedDraft });
	for (const [schema, result] of [[requiredSchema(notesCreateContract['~orpc'].outputSchema), created], [requiredSchema(notesDraftsCreateContract['~orpc'].outputSchema), createdDraft], [requiredSchema(notesDraftsUpdateContract['~orpc'].outputSchema), updatedDraft]] as const) {
		expect(v.parse(schema, result)).toEqual(result);
		for (const invalid of [{}, { ...result, future: true }, { createdNote: 7 }, { createdDraft: 7 }, { updatedDraft: 7 }]) expect(v.safeParse(schema, invalid).success).toBe(false);
	}
	expect(notes.pack).toHaveBeenCalledWith(model, me);
	expect(draftSerializer.pack).toHaveBeenCalledWith(draft, me);
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
