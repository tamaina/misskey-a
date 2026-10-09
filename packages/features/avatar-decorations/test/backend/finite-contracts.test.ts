/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { avatarDecorationsContract } from '../../backend/api.definition.js';
const avatarDecorationResult = requiredSchema(avatarDecorationsContract.get['~orpc'].outputSchema);
import { AvatarDecorationService } from '../../backend/services/AvatarDecorationService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { MiAvatarDecoration } from '../../backend/models/AvatarDecoration.js';

import { packedSchemas } from '../../../index/backend/packed.schema.js';
import { avatarDecorationsContract as nativeContract1 } from '../../backend/api.definition.js';
import { avatarDecorationsContract as nativeContract2 } from '../../backend/api.definition.js';
import { avatarDecorationsContract as nativeContract3 } from '../../backend/api.definition.js';
import { avatarDecorationsContract as nativeContract4 } from '../../backend/api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const input = requiredSchema(nativeContract1.create['~orpc'].inputSchema);
const output = requiredSchema(nativeContract2.create['~orpc'].outputSchema);
const definition = nativeContract3.create;
const listAvatarDecorationsOutput = requiredSchema(nativeContract4.list['~orpc'].outputSchema);

const params = { name: 'Ribbon', description: '', url: 'https://example.test/ribbon' };
const item = { id: 'decoration1', ...params, roleIdsThatCanBeUsedThisDecoration: [], category: null };
const result = { ...item, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: null };

test('avatar inputs strip extras and finite outputs reject extras, omissions and wrong types', () => {
	expect(v.parse(input, { ...params, future: true })).toEqual(params);
	for (const value of [{}, { ...params, name: '' }, { ...params, url: 7 }]) expect(v.safeParse(input, value).success).toBe(false);
	expect(v.parse(output, result)).toEqual(result);
	for (const value of [{ ...result, future: true }, { ...result, id: undefined }, { ...result, category: 7 }, { ...result, updatedAt: 7 }]) expect(v.safeParse(output, value).success).toBe(false);
	expect(v.parse(listAvatarDecorationsOutput, [result])).toEqual([result]);
	expect(v.parse(avatarDecorationResult, [item])).toEqual([item]);
	expect(v.safeParse(avatarDecorationResult, [{ ...item, future: true }]).success).toBe(false);
});

test('public empty avatar input retains its non-array JSON-object guard and missing-body default', () => {
	const schema = requiredSchema(avatarDecorationsContract.get['~orpc'].inputSchema);
	expect(v.parse(schema, undefined)).toEqual({});
	const request = { future: true };
	expect(v.parse(schema, request)).toEqual({});
	for (const value of [[], [1], null, 7, 'bad']) expect(v.safeParse(schema, value).success).toBe(false);
});
