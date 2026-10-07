/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import fs from 'node:fs';
import { expect, test } from 'vitest';
import * as v from 'valibot';
import _Ajv from 'ajv';
import { birthdayUsersInput, birthdayUsersDefinition, birthdayUsersOutput } from '@features/relationships/contract/birthday-endpoint-definitions.js';
import { jsonExclusiveObject, getJsonExclusiveObjectSchemaRegistration } from '@features/api/contract/json-exclusive-object.js';
import { jsonObject } from '@features/api/contract/json-object.js';
import { jsonNumber } from '@features/api/contract/json-number.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';
const Ajv = _Ajv.default;
const legacy = JSON.parse(fs.readFileSync(new URL('../../../test/fixtures/birthday-contract-baseline.json', import.meta.url), 'utf8'));
const canonical = (x:unknown) => JSON.parse(JSON.stringify(x));
const projection = () => projectEndpointContract(birthdayUsersDefinition);
const reviewedResponse = { ...legacy.meta.res, items: { ...legacy.meta.res.items, additionalProperties: false } };
test('full frozen input parity and explicitly reviewed finite response projection', () => {
 expect(canonical(projection().input)).toEqual(canonical(legacy.paramDef));
 expect(canonical(convertSchemaToOpenApiSchema(projection().response!, 'res', true))).toEqual(canonical(convertSchemaToOpenApiSchema(reviewedResponse, 'res', true)));
});
const dates = [{ month: 1, day: 2 }, { month: 2, day: 31 }, { month: 12, day: 31, extra: 1 }];
const values = [...dates, ...dates.map(begin => ({ begin, end: { month: 1, day: 1 } })), { month: 1, day: 2, begin: null, end: null }, { month: 1, day: 2, begin: { month: 1, day: 1 }, end: { month: 1, day: 1 } }, null, [], {}, { month: 0, day: 1 }, { month: 1.5, day: 2 }, { begin: { month: 1, day: 1 } }, { begin: { month: 1, day: 2 }, end: { month: 2, day: 3 }, month: 'x' }, { month: Infinity, day: 1 }];
test.each(values.map(birthday => ({ birthday })))('exact AJV acceptance/errors/mutation and native exclusive behavior $birthday', body => {
 const ajv = new Ajv({ useDefaults: true, strict: false, strictNumbers: true });
 const old = ajv.compile(legacy.paramDef), current = ajv.compile(projection().input);
 const a = structuredClone(body), b = structuredClone(body); const ok = old(a);
 expect(current(b)).toBe(ok); expect(current.errors).toEqual(old.errors); expect(b).toEqual(a);
 expect(v.safeParse(birthdayUsersInput, body).success).toBe(ok);
});
test('native preserves inactive malformed extras and own poison keys without input mutation', () => {
 const input = JSON.parse('{"birthday":{"month":1,"day":2,"begin":null,"end":null,"__proto__":{"x":1}},"offset":-1,"__proto__":{"x":2}}');
 const before = structuredClone(input); const out = v.parse(birthdayUsersInput, input);
 expect(input).toEqual(before); expect(Object.hasOwn(out, '__proto__')).toBe(true); expect(Object.hasOwn(out.birthday, '__proto__')).toBe(true);
 expect(out.birthday.begin).toBe(null); expect(out.limit).toBe(10); expect(out.offset).toBe(-1);
});
const a = jsonObject({ a: jsonNumber }), b = jsonObject({ b: jsonNumber });
const exclusive = jsonExclusiveObject([a, b]);
test('exact provenance, copied pair, detached guard/parser and lazy rejection', () => {
 const reg = getJsonExclusiveObjectSchemaRegistration(exclusive)!;
 for (const schema of [{ ...exclusive }, v.pipe(reg.guard, reg.parser), v.union(reg.options), reg.guard, reg.parser, v.lazy(() => exclusive), v.lazy(() => jsonObject({ nested: exclusive }))])expect(() => toLegacyJsonSchema(schema as any)).toThrow();
 for (const metadata of [{ oneOf: [] }, { type: 'string' }, { required: [] }, { additionalProperties: false }])expect(() => toLegacyJsonSchema(v.pipe(exclusive, v.metadata(metadata)))).toThrow();
 expect(v.safeParse(exclusive, { a: 1, b: 2 }).success).toBe(false); expect(v.safeParse(exclusive, { a: 1, b: 'x' }).success).toBe(true);
});
test('reject defaults, transforms, lazy, optional, predicates, third branch and lookalikes', () => {
 for (const field of [v.optional(jsonNumber, 1), v.optional(jsonNumber), v.pipe(jsonNumber, v.transform(x => x)), v.lazy(() => jsonNumber), v.pipe(jsonNumber, v.check(() => true)), v.string()])expect(() => jsonExclusiveObject([jsonObject({ n: field }), b])).toThrow();
 expect(() => jsonExclusiveObject([{ ...a }, b])).toThrow(); expect(() => jsonExclusiveObject([a, b, a] as any)).toThrow();
 expect(() => jsonExclusiveObject([jsonObject({ a: jsonObject({ b: jsonObject({ c: jsonNumber }) }) }), b])).toThrow();
});
test('shared and named definitions retain exclusive projection', () => {
 const result = toLegacyJsonSchema(jsonObject({ first: exclusive, second: exclusive }), { definitions: { choice: exclusive }, target: 'openapi-3.0', typeMode: 'ignore' });
 expect(JSON.stringify(result)).toContain('oneOf'); expect(JSON.stringify(result)).not.toContain('anyOf');
});

test('finite birthday results reject native extras while HTTP keeps unparsed response identity', async () => {
 const user = { id: 'user1', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };
 const item = { id: user.id, birthday: '2026-10-07', user };
 expect(v.parse(birthdayUsersOutput, [item])).toEqual([item]);
 for (const value of [{ ...item, extra: true }, { id: item.id, user }, { ...item, birthday: 1 }]) expect(v.safeParse(birthdayUsersOutput, [value]).success).toBe(false);
 const response = [{ ...item, extra: true }];
 const params = { birthday: { month: 10, day: 7 }, future: true };
 const endpoint = new ContractEndpoint({}, projection(), async ps => { expect(ps).toBe(params); return response; });
 expect(await endpoint.exec(params, null, null)).toBe(response);
 expect(params).toEqual({ birthday: { month: 10, day: 7 }, future: true, limit: 10, offset: 0 });
});
