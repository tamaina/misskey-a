/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { opaqueObject } from '@features/api/contract/opaque-object.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { packedAdminRolesCreateInput } from '@features/roles/contract/packed-endpoint-definitions.js';
import { voidAdminRolesUpdateInput, voidAdminRolesUpdateDefaultPoliciesInput } from '@features/roles/contract/void-endpoint-definitions.js';

const body = () => ({ name: 'x', description: '', color: null, iconUrl: null, target: 'manual', condFormula: { nonsense: true }, isPublic: true, isModerator: false, isAdministrator: false, asBadge: false, canEditMembersByModerator: false, displayOrder: 0, policies: { invalid: 'still accepted' } });

test('opaque objects are honest, identity-preserving, and not domain validators', () => {
 for (const value of [{}, Object.create(null), { type: 'not-a-formula' }, { nested: null }])expect(v.parse(opaqueObject, value)).toBe(value);
 for (const value of [null, undefined, [], 1, 'x', true])expect(v.safeParse(opaqueObject, value).success).toBe(false);
 expect(toLegacyJsonSchema(opaqueObject)).toEqual({ type: 'object' });
 expect(v.safeParse(packedAdminRolesCreateInput, body()).success).toBe(true);
 for (const field of ['condFormula', 'policies']) for (const value of [null, [], 42])expect(v.safeParse(packedAdminRolesCreateInput, { ...body(), [field]: value }).success).toBe(false);
 expect(v.safeParse(voidAdminRolesUpdateInput, { roleId: 'abc', condFormula: undefined, policies: undefined }).success).toBe(true);
 expect(v.safeParse(voidAdminRolesUpdateDefaultPoliciesInput, { policies: [] }).success).toBe(false);
});
test('opaque provenance rejects copied guards, structural metadata, and lazy concealment', () => {
 expect(() => toLegacyJsonSchema({ ...opaqueObject })).toThrow();
 expect(() => toLegacyJsonSchema(v.pipe(opaqueObject, v.metadata({ type: 'string' })))).toThrow();
 expect(() => toLegacyJsonSchema(v.pipe(v.looseObject({ nested: opaqueObject }), v.metadata({ properties: {} })))).toThrow();
 expect(() => toLegacyJsonSchema(v.lazy(() => opaqueObject))).toThrow();
 expect(() => toLegacyJsonSchema(v.pipe(opaqueObject, v.metadata({ description: 'wire object' })))).not.toThrow();
 const shared = v.optional(opaqueObject); expect(() => toLegacyJsonSchema(v.looseObject({ a: shared, b: v.pipe(shared, v.metadata({ type: 'string' })) }))).toThrow();
 expect(() => toLegacyJsonSchema(v.string(), { definitions: { Bad: v.pipe(opaqueObject, v.metadata({ type: 'string' })) } })).toThrow();
});
