/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { emojiSimpleResult, emojiDetailedResult, emojisResult, emojiAdministrationInputs } from '../../contract/index.js';
import { packedEmojiDetailedAdminSchema } from '../../contract/packed.js';
import { inlineAdminEmojiCopyInput, inlineAdminEmojiCopyOutput, inlineAdminEmojiCopyDefinition } from '../../contract/endpoint-definitions.js';
import { packedAdminEmojiListRemoteInput } from '../../contract/packed-endpoint-definitions.js';
import { portableV2AdminEmojiListOutput } from '../../contract/portable-constant-endpoint-definitions.js';
import { EmojiEntityService } from '../../backend/serializers/EmojiEntityService.js';
import { EndpointImplementation as CopyEndpoint } from '../../backend/endpoints/admin/emoji/copy.js';
import { EndpointImplementation as ListEndpoint } from '../../backend/endpoints/v2/admin/emoji/list.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import type { MiRole } from '@features/roles/backend/models/Role.js';
import type { MiEmoji } from '../../backend/models/Emoji.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';

const date = new Date('2026-01-01T00:00:00Z');
const emoji = (): MiEmoji => mockDeep<MiEmoji>({ id: 'emoji123', name: 'hello', aliases: [], category: null, host: null, license: null, uri: null, type: null, publicUrl: '', originalUrl: 'https://example/emoji.png', updatedAt: null, isSensitive: false, localOnly: false, roleIdsThatCanBeUsedThisEmojiAsReaction: [] });

function checkClosed(schema: v.GenericSchema, output: Record<string, unknown>, required: string) {
	expect(v.safeParse(schema, output).success).toBe(true);
	expect(v.safeParse(schema, { ...output, future: true }).success).toBe(false);
	const missing = { ...output };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...output, [required]: typeof output[required] === 'number' ? 'bad' : 7 }).success).toBe(false);
}

test.each([false, true])('actual simple/detailed/admin serializers retain nullable and optional variants: %s', async populated => {
	const service = new EmojiEntityService(mockDeep(), mockDeep());
	const entity = emoji();
	if (populated) {
		entity.updatedAt = date;
		entity.localOnly = true;
		entity.isSensitive = true;
		entity.roleIdsThatCanBeUsedThisEmojiAsReaction = ['role123'];
	}
	const simple = await service.packSimple(entity);
	checkClosed(emojiSimpleResult, simple, 'name');
	expect(simple.url).toBe(entity.originalUrl);
	expect(simple.localOnly).toBe(populated ? true : undefined);
	expect(simple.roleIdsThatCanBeUsedThisEmojiAsReaction).toEqual(populated ? ['role123'] : undefined);
	checkClosed(emojiDetailedResult, await service.packDetailed(entity), 'id');
	const role = mockDeep<MiRole>({ id: 'role123', name: 'role', displayOrder: 1 });
	const admin = await service.packDetailedAdmin(entity, { roles: new Map([[role.id, role]]) });
	checkClosed(packedEmojiDetailedAdminSchema, admin, 'name');
	expect(admin.updatedAt).toBe(populated ? date.toISOString() : null);
	expect(admin.roleIdsThatCanBeUsedThisEmojiAsReaction).toEqual(populated ? [{ id: role.id, name: role.name }] : []);
	if (populated) expect(v.safeParse(packedEmojiDetailedAdminSchema, { ...admin, roleIdsThatCanBeUsedThisEmojiAsReaction: [{ id: role.id, name: role.name, future: true }] }).success).toBe(false);
	checkClosed(emojisResult, { emojis: [simple] }, 'emojis');
});

test('actual copy handler returns every detailed field, including previously undocumented fields', async () => {
	const repository = mockDeep<ConstructorParameters<typeof CopyEndpoint>[0]>();
	const entity = emoji();
	repository.findOneBy.mockResolvedValue(entity);
	const serializer = new EmojiEntityService(mockDeep(), mockDeep());
	const custom = mockDeep<ConstructorParameters<typeof CopyEndpoint>[2]>();
	custom.checkDuplicate.mockResolvedValue(false);
	custom.add.mockResolvedValue(entity);
	const drive = mockDeep<ConstructorParameters<typeof CopyEndpoint>[3]>();
	drive.uploadFromUrl.mockResolvedValue(mockDeep<MiDriveFile>({ url: entity.originalUrl, webpublicUrl: null, type: 'image/png', webpublicType: null }));
	const endpoint = new CopyEndpoint(repository, serializer, custom, drive);
	const output = await endpoint.exec({ emojiId: entity.id, future: true }, mockDeep(), null);
	checkClosed(inlineAdminEmojiCopyOutput, output, 'name');
	expect(output).toEqual(await serializer.packDetailed(entity));
	expect(v.safeParse(inlineAdminEmojiCopyOutput, { id: entity.id }).success).toBe(false);
});

test('actual v2 list handler emits finite counts and admin emoji objects with defaults', async () => {
	const custom = mockDeep<ConstructorParameters<typeof ListEndpoint>[0]>();
	custom.fetchEmojis.mockResolvedValue({ emojis: [emoji()], count: 1, allCount: 1, allPages: 1 });
	const serializer = new EmojiEntityService(mockDeep(), mockDeep());
	const endpoint = new ListEndpoint(custom, serializer, mockDeep());
	const output = await endpoint.exec({ future: true }, mockDeep(), null);
	checkClosed(portableV2AdminEmojiListOutput, output, 'count');
	expect(custom.fetchEmojis.mock.calls[0][1]).toEqual({ limit: 10, page: undefined, sortKeys: ['-id'] });
});

test('native finite inputs and strict outputs stay separate from open unparsed HTTP', async () => {
	expect(v.parse(inlineAdminEmojiCopyInput, { emojiId: 'emoji123', future: true })).toEqual({ emojiId: 'emoji123' });
	for (const value of [{}, { emojiId: 7 }, { emojiId: 'bad-id' }]) expect(v.safeParse(inlineAdminEmojiCopyInput, value).success).toBe(false);
	expect(v.parse(packedAdminEmojiListRemoteInput, { future: true })).toEqual({ query: null, host: null, limit: 10 });
	expect(v.parse(emojiAdministrationInputs['admin/emoji/set-category-bulk'], { ids: ['emoji123'], category: null, future: true })).toEqual({ ids: ['emoji123'], category: null });
	const projection = projectEndpointContract(inlineAdminEmojiCopyDefinition);
	expect(projection.input).not.toHaveProperty('additionalProperties');
	expect(projection.response).toMatchObject({ additionalProperties: false });
	const params = { emojiId: 'emoji123', future: true };
	const nativeResponse = await new EmojiEntityService(mockDeep(), mockDeep()).packDetailed(emoji());
	expect(v.safeParse(inlineAdminEmojiCopyOutput, nativeResponse).success).toBe(true);
	const response = { ...nativeResponse, future: true };
	const endpoint = new ContractEndpoint({}, projection, async ps => { expect(ps).toBe(params); return response; });
	expect(await endpoint.exec(params, null, null)).toBe(response);
	expect(v.safeParse(inlineAdminEmojiCopyOutput, response).success).toBe(false);
	await expect(endpoint.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/required' } });
});
