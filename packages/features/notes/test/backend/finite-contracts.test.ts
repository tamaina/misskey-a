/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { ModuleRef } from '@nestjs/core';
import { inlineNotesDraftsCountDefinition as countDefinition, inlineNotesDraftsCountInput as countInput, inlineNotesDraftsCountOutput as countOutput, inlineNotesShowPartialBulkDefinition as partialDefinition, inlineNotesShowPartialBulkInput as partialInput, inlineNotesShowPartialBulkOutput as partialOutput, inlineNotesTranslateDefinition as translateDefinition, inlineNotesTranslateInput as translateInput, inlineNotesTranslateOutput as translateOutput } from '../../contract/endpoint-definitions.js';
import { EndpointImplementation as CountEndpoint } from '../../backend/endpoints/notes/drafts/count.js';
import { EndpointImplementation as PartialEndpoint } from '../../backend/endpoints/notes/show-partial-bulk.js';
import { EndpointImplementation as TranslateEndpoint } from '../../backend/endpoints/notes/translate.js';
import { NoteEntityService } from '../../backend/serializers/NoteEntityService.js';
import type { ReactionService } from '../../backend/services/ReactionService.js';
import type { ReactionsBufferingService } from '../../backend/services/ReactionsBufferingService.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import type { NotesRepository, NoteDraftsRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { MiNote } from '../../backend/models/Note.js';
import { packedNoteSchema } from '../../contract/packed.js';
import { packedNotesShowDefinition } from '../../contract/packed-endpoint-definitions.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import type { MiChannel } from '@features/channels/backend/models/Channel.js';
import type { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import type { GetterService } from '@features/api/backend/transport/GetterService.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { Packed } from '@features/index/contract/packed.js';

const item = { id: 'note123', reactions: { '🔥': 1 }, reactionEmojis: { 'remote@host': 'https://host/emoji.png' } };
const translation = { sourceLang: 'JA', text: 'hello' };

test('native finite schemas retain explicit fields, required properties and optional root', () => {
	expectTypeOf<v.InferOutput<typeof partialInput>>().toEqualTypeOf<{ noteIds: string[] }>();
	expectTypeOf<v.InferOutput<typeof translateInput>>().toEqualTypeOf<{ noteId: string; targetLang: string }>();
	expectTypeOf<v.InferOutput<typeof partialOutput>>().toEqualTypeOf<{ id: string; reactions: Record<string, number>; reactionEmojis: Record<string, string> }[]>();
	expectTypeOf<v.InferOutput<typeof translateOutput>>().toEqualTypeOf<{ sourceLang: string; text: string } | undefined>();
	expect(v.parse(countInput, { i: 'transport', future: true })).toEqual({});
	expect(v.parse(countOutput, 7)).toBe(7);
	for (const value of [undefined, '7', {}]) expect(v.safeParse(countOutput, value).success).toBe(false);
	expect(v.parse(partialInput, { noteIds: ['note123'], future: true })).toEqual({ noteIds: ['note123'] });
	for (const value of [{}, { noteIds: [] }, { noteIds: ['bad-id'] }, { noteIds: [7] }, { noteIds: Array(101).fill('note123') }]) expect(v.safeParse(partialInput, value).success).toBe(false);
	expect(v.parse(partialOutput, [item])).toEqual([item]);
	for (const value of [[{ id: 'note123', reactions: {} }], [{ ...item, id: 7 }], [{ ...item, reactions: { x: 'bad' } }], [{ ...item, reactionEmojis: { x: 7 } }], [{ ...item, future: true }]]) expect(v.safeParse(partialOutput, value).success).toBe(false);
	expect(v.parse(translateInput, { noteId: 'note123', targetLang: 'en-US', future: true })).toEqual({ noteId: 'note123', targetLang: 'en-US' });
	for (const value of [{ noteId: 'note123' }, { noteId: 'note123', targetLang: 7 }, { noteId: null, targetLang: 'en' }]) expect(v.safeParse(translateInput, value).success).toBe(false);
	expect(v.parse(translateOutput, undefined)).toBeUndefined();
	expect(v.parse(translateOutput, translation)).toEqual(translation);
	for (const value of [null, { sourceLang: 'JA' }, { ...translation, text: 7 }, { ...translation, sourceLang: null }, { ...translation, future: true }]) expect(v.safeParse(translateOutput, value).success).toBe(false);
});

test('JSON projection retains original open inputs, limits and optionality; finite output objects are closed', () => {
	expect(projectEndpointContract(countDefinition).input).toEqual({ type: 'object', properties: {}, required: [] });
	expect(projectEndpointContract(partialDefinition).input).toEqual({ type: 'object', properties: { noteIds: { type: 'array', items: { type: 'string', format: 'misskey:id' }, minItems: 1, maxItems: 100 } }, required: ['noteIds'] });
	expect(projectEndpointContract(translateDefinition).input).toEqual({ type: 'object', properties: { noteId: { type: 'string', format: 'misskey:id' }, targetLang: { type: 'string' } }, required: ['noteId', 'targetLang'] });
	const partialJson = toLegacyJsonSchema(partialOutput, { target: 'openapi-3.0', typeMode: 'output' });
	expect(partialJson).toMatchObject({ type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'reactions', 'reactionEmojis'] } });
	expect(projectEndpointContract(translateDefinition).response).toMatchObject({ optional: true, additionalProperties: false });
});

test('legacy HTTP accepts original extra input keys and returns extra output keys without parsing', async () => {
	const countParams = { i: 'transport', future: true };
	const partialParams = { noteIds: ['note123'], i: 'transport', future: true };
	const translateParams = { noteId: 'note123', targetLang: 'en', i: 'transport', future: true };
	const partialResponse = [{ ...item, future: true }];
	const translateResponse = { ...translation, future: true };
	const count = new ContractEndpoint({}, projectEndpointContract(countDefinition), async ps => { expect(ps).toBe(countParams); return 7; });
	const partial = new ContractEndpoint({}, projectEndpointContract(partialDefinition), async ps => { expect(ps).toBe(partialParams); return partialResponse; });
	const translate = new ContractEndpoint({}, projectEndpointContract(translateDefinition), async ps => { expect(ps).toBe(translateParams); return translateResponse; });
	expect(await count.exec(countParams, null, null)).toBe(7);
	expect(await partial.exec(partialParams, null, null)).toBe(partialResponse);
	expect(await translate.exec(translateParams, null, null)).toBe(translateResponse);
	expect(v.safeParse(partialOutput, partialResponse).success).toBe(false);
	expect(v.safeParse(translateOutput, translateResponse).success).toBe(false);
	await expect(partial.exec({ noteIds: [] }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532', info: { param: '#/properties/noteIds/minItems' } });
	await expect(translate.exec({ noteId: 'note123' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/required' } });
});

test('draft count handler retains author filtering and scalar response', async () => {
	const repository = mockDeep<NoteDraftsRepository>();
	const query = mockDeep<ReturnType<NoteDraftsRepository['createQueryBuilder']>>();
	repository.createQueryBuilder.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.getCount.mockResolvedValue(7);
	const user = mockDeep<MiLocalUser>({ id: 'user123' });
	const endpoint = new CountEndpoint(repository);
	expect(await endpoint.exec({ i: 'transport' }, user, null)).toBe(7);
	expect(query.where).toHaveBeenCalledWith('drafts.userId = :meId', { meId: user.id });
});

test.each([false, true])('real partial serializer emits exactly the documented fields with buffering=%s', async enableReactionsBuffering => {
	const moduleRef = mockDeep<ModuleRef>();
	const settings = mockDeep<MiMeta>({ enableReactionsBuffering, ugcVisibilityForVisitor: 'all' });
	const notes = mockDeep<NotesRepository>();
	const reaction = mockDeep<ReactionService>();
	const buffering = mockDeep<ReactionsBufferingService>();
	const emoji = mockDeep<CustomEmojiService>();
	moduleRef.get.mockReturnValueOnce(mockDeep()).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(emoji).mockReturnValueOnce(reaction).mockReturnValueOnce(buffering).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(mockDeep());
	const serializer = new NoteEntityService(moduleRef, settings, mockDeep(), notes, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep());
	serializer.onModuleInit();
	const visible = new MiNote({ id: item.id, userHost: 'host', reactions: item.reactions });
	const hidden = new MiNote({ id: 'hidden123' });
	notes.find.mockResolvedValue([visible, hidden]);
	vi.spyOn(serializer, 'isVisibleForMe').mockImplementation(async note => note.id === visible.id);
	buffering.getMany.mockResolvedValue(new Map([[visible.id, { deltas: { '🔥': 1 }, pairs: [] }]]));
	buffering.mergeReactions.mockReturnValue(item.reactions);
	reaction.convertLegacyReactions.mockReturnValue(item.reactions);
	emoji.populateEmojis.mockResolvedValue(item.reactionEmojis);
	const endpoint = new PartialEndpoint(serializer);
	const result = await endpoint.exec({ noteIds: [visible.id, hidden.id] }, null, null);
	expect(result).toEqual([item]);
	expect(v.parse(partialOutput, result)).toEqual(result);
	expect(Object.keys(result[0])).toEqual(['id', 'reactions', 'reactionEmojis']);
	expect(serializer.isVisibleForMe).toHaveBeenCalledTimes(2);
	expect(buffering.mergeReactions).toHaveBeenCalledWith(item.reactions, enableReactionsBuffering ? { '🔥': 1 } : {});
});

test.each([false, true])('translate handler projects provider response and retains optional empty-text return; pro=%s', async deeplIsPro => {
	const settings = mockDeep<MiMeta>({ deeplAuthKey: 'test-fixture', deeplIsPro });
	const notes = mockDeep<NoteEntityService>();
	const getter = mockDeep<GetterService>();
	const http = mockDeep<HttpRequestService>();
	const roles = mockDeep<RoleService>();
	const user = mockDeep<MiLocalUser>({ id: 'user123' });
	const note = mockDeep<MiNote>({ id: 'note123', text: 'こんにちは', cw: null });
	roles.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<RoleService['getUserPolicies']>>>({ canUseTranslator: true }));
	getter.getNote.mockResolvedValue(note);
	notes.isVisibleForMe.mockResolvedValue(true);
	notes.pack.mockResolvedValue(mockDeep<Packed<'Note'>>({ isHidden: false }));
	const response = mockDeep<Awaited<ReturnType<HttpRequestService['send']>>>();
	response.json.mockResolvedValue({ translations: [{ detected_source_language: 'JA', text: 'hello', providerExtra: true }], providerExtra: true });
	http.send.mockResolvedValue(response);
	const endpoint = new TranslateEndpoint(settings, notes, getter, http, roles);
	const result = await endpoint.exec({ noteId: note.id, targetLang: 'en-US' }, user, null);
	expect(result).toEqual(translation);
	expect(v.parse(translateOutput, result)).toEqual(result);
	expect(Object.keys(result!)).toEqual(['sourceLang', 'text']);
	expect(http.send.mock.calls[0][0]).toBe(deeplIsPro ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate');
	expect(new URLSearchParams(String(http.send.mock.calls[0][1]?.body)).get('target_lang')).toBe('en');
	note.text = ' ';
	expect(await endpoint.exec({ noteId: note.id, targetLang: 'en-US' }, user, null)).toBeUndefined();
	expect(http.send).toHaveBeenCalledTimes(1);
});

test.each([false, true])('real Note serializer preserves native undefined and JSON wire fields with detail=%s', async detail => {
	const moduleRef = mockDeep<ModuleRef>();
	const users = mockDeep<UserEntityService>();
	const files = mockDeep<DriveFileEntityService>();
	const emoji = mockDeep<CustomEmojiService>();
	const reaction = mockDeep<ReactionService>();
	const buffering = mockDeep<ReactionsBufferingService>();
	const ids = mockDeep<IdService>();
	const polls = mockDeep<ConstructorParameters<typeof NoteEntityService>[5]>();
	const date = new Date('2026-10-08T00:00:00.000Z');
	const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example.com/avatar.png', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' } satisfies Packed<'UserLite'>;
	users.pack.mockResolvedValue(user);
	files.packManyByIds.mockResolvedValue([]);
	emoji.populateEmojis.mockResolvedValue({});
	reaction.convertLegacyReactions.mockReturnValue({});
	buffering.mergeReactions.mockReturnValue({});
	ids.parse.mockReturnValue({ date });
	polls.findOneByOrFail.mockResolvedValue(mockDeep<Awaited<ReturnType<typeof polls.findOneByOrFail>>>({ choices: ['one', 'two'], votes: [2, 0], multiple: false, expiresAt: date }));
	moduleRef.get.mockReturnValueOnce(users).mockReturnValueOnce(files).mockReturnValueOnce(emoji).mockReturnValueOnce(reaction).mockReturnValueOnce(buffering).mockReturnValueOnce(ids).mockReturnValueOnce(mockDeep());
	const channel = mockDeep<MiChannel>({ id: 'channel123', name: 'Fixture', color: '#000000', isSensitive: false, allowRenoteToExternal: true, userId: null });
	const values = { userId: user.id, userHost: null, text: 'fixture', cw: null, name: null, url: null, uri: null, visibility: 'public', localOnly: false, reactionAcceptance: null, repliesCount: 0, renoteCount: 0, reactions: {}, reactionAndUserPairCache: [], emojis: [], fileIds: [], tags: [], mentions: [], hasPoll: true, replyId: null, renoteId: null, channelId: channel.id, channel, clippedCount: 0 } satisfies Partial<MiNote>;
	const reply = new MiNote({ ...values, id: 'reply123', hasPoll: false });
	const note = new MiNote({ ...values, id: 'note123', replyId: reply.id, reply });
	const serializer = new NoteEntityService(moduleRef, mockDeep<MiMeta>({ enableReactionsBuffering: false }), mockDeep(), mockDeep(), mockDeep(), polls, mockDeep(), mockDeep(), mockDeep());
	serializer.onModuleInit();
	const raw = await serializer.pack(note, null, { detail, skipHide: true });
	expect(raw.createdAt).toBe(date.toISOString());
	expect(Object.hasOwn(raw, 'uri')).toBe(true);
	expect(raw.uri).toBeUndefined();
	expect(v.parse(packedNoteSchema, raw)).toEqual(raw);
	const wire = JSON.parse(JSON.stringify(raw));
	expect(Object.hasOwn(wire, 'uri')).toBe(false);
	expect(v.parse(packedNoteSchema, wire)).toEqual(wire);
	expect(wire.channel).toEqual({ id: channel.id, name: channel.name, color: channel.color, isSensitive: false, allowRenoteToExternal: true, userId: null });
	if (detail) {
		expect(raw.poll?.expiresAt).toBe(date.toISOString());
		expect(raw.poll?.choices).toEqual([{ text: 'one', votes: 2, isVoted: false }, { text: 'two', votes: 0, isVoted: false }]);
		expect(raw.reply?.id).toBe(reply.id);
		for (const invalid of [
			{ ...wire, poll: { ...wire.poll, future: true } },
			{ ...wire, poll: { ...wire.poll, multiple: null } },
			{ ...wire, poll: { ...wire.poll, choices: [{ text: 'one', votes: 2, isVoted: false, future: true }] } },
			{ ...wire, poll: { ...wire.poll, choices: [{ text: 'one', votes: '2', isVoted: false }] } },
			{ ...wire, reply: { ...wire.reply, future: true } },
		]) expect(v.safeParse(packedNoteSchema, invalid).success).toBe(false);
	} else {
		expect(Object.hasOwn(raw, 'poll')).toBe(false);
		expect(Object.hasOwn(raw, 'reply')).toBe(false);
	}
	for (const invalid of [{ ...wire, future: true }, { ...wire, id: 7 }, { ...wire, channel: { ...wire.channel, future: true } }]) expect(v.safeParse(packedNoteSchema, invalid).success).toBe(false);
	const { id: _id, ...missing } = wire;
	expect(v.safeParse(packedNoteSchema, missing).success).toBe(false);
	const params = { noteId: note.id, future: true };
	const response = { ...raw, future: true };
	const endpoint = new ContractEndpoint({}, projectEndpointContract(packedNotesShowDefinition), async input => { expect(input).toBe(params); return response; });
	expect(await endpoint.exec(params, null, null)).toBe(response);
	expect(v.safeParse(packedNoteSchema, response).success).toBe(false);
});
