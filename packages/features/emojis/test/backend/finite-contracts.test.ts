/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { emojiSimpleResult, emojiDetailedResult } from '../../backend/api.definition.js';

import { EmojiEntityService } from '../../backend/serializers/EmojiEntityService.js';

import { packedSchemas } from '../../../index/backend/packed.schema.js';
import { emojisContract as nativeContract1 } from '../../backend/api.definition.js';
import { emojisContract as nativeContract2 } from '../../backend/api.definition.js';
import { emojisContract as nativeContract3 } from '../../backend/api.definition.js';
import { emojisContract as nativeContract4 } from '../../backend/api.definition.js';
import { emojisContract as nativeContract5 } from '../../backend/api.definition.js';
import type { MiEmoji } from '../../backend/models/Emoji.js';
import type { MiRole } from '@features/roles/backend/models/Role.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const emojisResult = requiredSchema(nativeContract1.emojis['~orpc'].outputSchema);
const packedEmojiDetailedAdminSchema = packedSchemas.EmojiDetailedAdmin;
const inlineAdminEmojiCopyInput = requiredSchema(nativeContract1.copy['~orpc'].inputSchema);
const inlineAdminEmojiCopyOutput = requiredSchema(nativeContract2.copy['~orpc'].outputSchema);
const inlineAdminEmojiCopyDefinition = nativeContract3.copy;
const packedAdminEmojiListRemoteInput = requiredSchema(nativeContract4.listRemote['~orpc'].inputSchema);
const portableV2AdminEmojiListOutput = requiredSchema(nativeContract5.v2List['~orpc'].outputSchema);

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
