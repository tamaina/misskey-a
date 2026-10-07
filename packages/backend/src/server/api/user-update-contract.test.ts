/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { Ajv } from 'ajv';
import { iUpdateDefinition, iUpdateInput } from '../../../../features/users/contract/user-update-endpoint-definitions.js';
import { languageKeys } from '../../../../features/users/contract/languages.js';
import { muteWordInputItem } from '../../../../features/api/contract/mute-word-input-item.js';
import { notificationReceiveRule } from '../../../../features/users/contract/notification-receive-config.js';
import { jsonObject } from '../../../../features/api/contract/json-object.js';
import { uniqueStringArray } from '../../../../features/api/contract/unique-string-array.js';
import { toLegacyJsonSchema } from '../../../../features/api/backend/index.js';
import { projectEndpointContract } from './contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';
import type { Schema } from '@/misc/json-schema.js';
import legacy from '../../../test/fixtures/user-update-contract-baseline.json' with { type: 'json' };
vi.mock('./endpoints.js', () => ({ default: [] }));
const projection = () => projectEndpointContract(iUpdateDefinition).input;
const canonical = (x: unknown) => JSON.parse(JSON.stringify(x));
test('exact legacy projection, all 37 optional fields and 221 language keys', () => {
 expect(canonical(projection())).toEqual(canonical(legacy));
 expect(Object.keys(legacy.properties)).toHaveLength(37);
 expect(languageKeys).toHaveLength(221);
 expect(Object.hasOwn(projection(), 'required')).toBe(false);
 expect(Object.keys(projection().properties!)).toEqual(Object.keys(legacy.properties));
 const assertNoDefault = (node: unknown): void => {
  if (node === null || typeof node !== 'object') return;
  expect(Object.hasOwn(node, 'default')).toBe(false);
  for (const child of Object.values(node)) assertNoDefault(child);
 };
 assertNoDefault(projection());
});
test('exact unchanged response declaration and OpenAPI input projection', () => {
 expect(projectEndpointContract(iUpdateDefinition).response).toEqual({ type: 'object', optional: false, nullable: false, ref: 'MeDetailed' });
 expect(convertSchemaToOpenApiSchema(projection(), 'param', false)).toEqual(convertSchemaToOpenApiSchema(legacy as Schema, 'param', false));
});
const valid = [{}, { name: null, lang: null }, { name: '😀'.repeat(50) }, { birthday: '0000-99-99' }, { fields: [] },
 { avatarDecorations: [{ id: 'A1', angle: null, flipH: null, offsetX: -0.25, offsetY: 0.25, extra: true }] },
 { mutedWords: [[], '', ['a', 'a'], 'x'], hardMutedWords: ['x', []] }, { alsoKnownAs: ['a', 'A'] },
 { notificationRecieveConfig: { note: { type: 'all', userListId: null }, follow: { type: 'list', userListId: 'A1' }, unknown: { anything: 1 } } },
 { name: undefined, notificationRecieveConfig: { note: undefined } }, { makeNotesFollowersOnlyBefore: -1 },
 JSON.parse('{"__proto__":{"x":1},"notificationRecieveConfig":{"note":{"type":"all","__proto__":{"y":1}},"__proto__":{"z":1}}}')];
const invalid = [null, [], { name: '' }, { name: '😀'.repeat(51) }, { birthday: '2020-1-01' }, { lang: 'invalid' },
 { avatarDecorations: [{ id: 'a-b' }] }, { avatarDecorations: [{ id: 'A', angle: 0.5001 }] }, { avatarDecorations: Array(17).fill({ id: 'A' }) },
 { mutedWords: [1] }, { mutedWords: [[null]] }, { alsoKnownAs: ['a', 'a'] }, { alsoKnownAs: Array.from({ length: 11 }, (_, i) => String(i)) },
 { notificationRecieveConfig: { note: { type: 'list' } } }, { notificationRecieveConfig: { note: { type: 'alll' } } },
 { notificationRecieveConfig: { note: { type: 'list', userListId: null } } }, { notificationRecieveConfig: null },
 { makeNotesHiddenBefore: 1.5 }, { makeNotesHiddenBefore: Infinity }];
test.each([...valid.map(input => ({ input, expected: true })), ...invalid.map(input => ({ input, expected: false }))])('native/AJV acceptance $expected for $input', ({ input, expected }) => {
 const ajv = new Ajv({ useDefaults: true, strict: false, strictNumbers: true }); ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);
 const oldValidate = ajv.compile(legacy);
 const newValidate = ajv.compile(projection());
 expect(oldValidate(input)).toBe(expected);
 expect(newValidate(input)).toBe(expected);
 expect(newValidate.errors).toEqual(oldValidate.errors);
 expect(v.safeParse(iUpdateInput, input).success).toBe(expected);
});
test('native retains own poison keys and opaque extras', () => {
 const input = valid.at(-1)!; const result = v.parse(iUpdateInput, input);
 expect(Object.hasOwn(result, '__proto__')).toBe(true);
 expect(Object.hasOwn(result.notificationRecieveConfig!, '__proto__')).toBe(true);
 expect(Object.hasOwn(result.notificationRecieveConfig!.note!, '__proto__')).toBe(true);
});
test('closed unions are frozen, ordered and reject copied projection or lazy bypasses', () => {
 for (const schema of [muteWordInputItem(), notificationReceiveRule]) {
  expect(Object.isFrozen(schema)).toBe(true); expect(Object.isFrozen(schema.options)).toBe(true);
  expect(toLegacyJsonSchema(schema, { target: 'openapi-3.0' })).toHaveProperty('oneOf');
  expect(toLegacyJsonSchema({ ...schema }, { target: 'openapi-3.0' })).toHaveProperty('anyOf');
  expect(() => toLegacyJsonSchema(v.pipe(schema, v.metadata({ oneOf: [] })), { target: 'openapi-3.0' })).toThrow();
  expect(() => toLegacyJsonSchema(v.lazy(() => schema), { target: 'openapi-3.0' })).toThrow();
 }
 expect(v.parse(muteWordInputItem(), ['x'])).toEqual(['x']);
});
test('required omission is confined to genuine all-optional objects', () => {
 for (const child of [muteWordInputItem(), uniqueStringArray(v.string())]) {
  expect(() => toLegacyJsonSchema(v.pipe(jsonObject({ x: v.optional(child) }), v.metadata({ required: undefined })))).not.toThrow();
  expect(() => toLegacyJsonSchema(v.pipe(jsonObject({ x: child }), v.metadata({ required: undefined })))).toThrow();
  expect(() => toLegacyJsonSchema(v.pipe({ ...jsonObject({ x: v.optional(child) }) }, v.metadata({ required: undefined })))).toThrow();
  expect(() => toLegacyJsonSchema(jsonObject({ x: v.optional(v.pipe(child, v.metadata({ required: undefined }))) }))).toThrow();
 }
});

test('inference honestly models mixed mute arrays and explicit optional undefined', () => {
 type Input = v.InferInput<typeof iUpdateInput>;
 expectTypeOf<Input['mutedWords']>().toEqualTypeOf<(string | string[])[] | undefined>();
 expectTypeOf<Input['name']>().toEqualTypeOf<string | null | undefined>();
 expectTypeOf<Input['lang']>().toEqualTypeOf<typeof languageKeys[number] | null | undefined>();
 const input: Input = { name: undefined, notificationRecieveConfig: { note: undefined }, mutedWords: ['a', ['b']] };
 expect(v.safeParse(iUpdateInput, input).success).toBe(true);
 // @ts-expect-error A list discriminator requires a real userListId.
 const missingList: Input = { notificationRecieveConfig: { note: { type: 'list' } } };
 expect(v.safeParse(iUpdateInput, missingList).success).toBe(false);
});
test('nullable or unregistered wrappers cannot borrow the no-op allowance', () => {
 const object = jsonObject({ x: v.optional(muteWordInputItem()) });
 expect(() => toLegacyJsonSchema(v.pipe(v.nullable(object), v.metadata({ nullable: false })))).toThrow();
 expect(() => toLegacyJsonSchema(v.pipe({ ...object }, v.metadata({ nullable: false })))).toThrow();
 expect(() => toLegacyJsonSchema(v.pipe(object, v.metadata({ required: [] })))).toThrow();
 expect(() => toLegacyJsonSchema(v.pipe(object, v.metadata({ required: undefined, oneOf: [] })))).toThrow();
 expect(() => toLegacyJsonSchema(v.string(), { definitions: { hidden: v.pipe(muteWordInputItem(), v.metadata({ oneOf: [] })) } })).toThrow();
});
