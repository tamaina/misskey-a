/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, expectTypeOf } from 'vitest';
import { Ajv } from 'ajv';
import * as v from 'valibot';
import { exportedAntenna } from '@features/timelines/contract/antenna-export.js';
import type { ExportedAntenna } from '@features/timelines/contract/antenna-export.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';

// Frozen before migration, independent of the native contract and converter.
const exportedAntennaSchema = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		src: { type: 'string', enum: ['home', 'all', 'users', 'list', 'users_blacklist'] },
		userListAccts: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		keywords: { type: 'array', items: {
			type: 'array', items: {
				type: 'string',
			},
		} },
		excludeKeywords: { type: 'array', items: {
			type: 'array', items: {
				type: 'string',
			},
		} },
		users: { type: 'array', items: {
			type: 'string',
		} },
		caseSensitive: { type: 'boolean' },
		localOnly: { type: 'boolean' },
		excludeBots: { type: 'boolean' },
		withReplies: { type: 'boolean' },
		withFile: { type: 'boolean' },
		excludeNotesInSensitiveChannel: { type: 'boolean' },
	},
	required: ['name', 'src', 'keywords', 'excludeKeywords', 'users', 'caseSensitive', 'withReplies', 'withFile'],
} as const;

const projected = toLegacyJsonSchema(exportedAntenna, { target: 'openapi-3.0', typeMode: 'ignore' });
const oldValidate = new Ajv().compile(exportedAntennaSchema);
const validate = new Ajv().compile<ExportedAntenna>(projected);
const valid = () => ({
	name: 'Antenna', src: 'all' as const, keywords: [['hello']], excludeKeywords: [],
	users: [], caseSensitive: false, withReplies: true, withFile: false,
});
const cases: [string, unknown, boolean][] = [
	['minimum', valid(), true],
	['all optionals absent', valid(), true],
	['all optionals undefined', { ...valid(), userListAccts: undefined, localOnly: undefined, excludeBots: undefined, excludeNotesInSensitiveChannel: undefined }, true],
	['all optionals specified', { ...valid(), userListAccts: ['one', '', 'one'], localOnly: true, excludeBots: false, excludeNotesInSensitiveChannel: true }, true],
	['nullable accounts', { ...valid(), userListAccts: null }, true],
	['missing list accounts', { ...valid(), src: 'list' }, true],
	['empty accounts', { ...valid(), src: 'list', userListAccts: [] }, true],
	['empty keyword groups', { ...valid(), keywords: [], excludeKeywords: [[]] }, true],
	['duplicate users', { ...valid(), users: ['one', '', 'one'] }, true],
	['unknown fields', { ...valid(), extra: { any: true } }, true],
	['Unicode 100 code points', { ...valid(), name: '😀'.repeat(100) }, true],
	['Unicode 101 code points', { ...valid(), name: '😀'.repeat(101) }, false],
	['empty name', { ...valid(), name: '' }, false],
	['wrong name type', { ...valid(), name: 7 }, false],
	['wrong source', { ...valid(), src: 'other' }, false],
	['nonstring account', { ...valid(), userListAccts: [7] }, false],
	['nonarray account', { ...valid(), userListAccts: 'one' }, false],
	['null boolean', { ...valid(), localOnly: null }, false],
	['wrong boolean', { ...valid(), excludeBots: 1 }, false],
	['flat keywords', { ...valid(), keywords: ['hello'] }, false],
	['wrong nested keywords', { ...valid(), excludeKeywords: [[null]] }, false],
	['array root', [], false], ['null root', null, false], ['undefined root', undefined, false],
	['string root', 'hello', false], ['number root', 7, false],
];
for (const src of ['home', 'all', 'users', 'list', 'users_blacklist']) cases.push(['source ' + src, { ...valid(), src }, true]);
for (const key of exportedAntennaSchema.required) {
	const missing: Record<string, unknown> = valid();
	delete missing[key];
	cases.push(['missing ' + key, missing, false]);
}

describe('native antenna export artifact', () => {
	it('preserves the frozen JSON schema, property order and required order', () => {
		expect(projected).toStrictEqual(exportedAntennaSchema);
		expect(Object.keys(projected.properties ?? {})).toEqual(Object.keys(exportedAntennaSchema.properties));
	});
	it.each(cases)('%s keeps native and original AJV acceptance', (_name, input, accepted) => {
		const oldInput = structuredClone(input);
		const newInput = structuredClone(input);
		expect(oldValidate(oldInput)).toBe(accepted);
		expect(validate(newInput)).toBe(accepted);
		expect(validate.errors).toStrictEqual(oldValidate.errors);
		expect(newInput).toStrictEqual(input);
		expect(v.safeParse(exportedAntenna, input).success).toBe(accepted);
	});
	it('keeps own poison keys in native output and never mutates AJV input', () => {
		const input = { ...valid(), ...JSON.parse('{"__proto__":{"unsafe":true},"constructor":"own","prototype":42}') };
		const before = Object.getOwnPropertyDescriptors(input);
		expect(validate(input)).toBe(true);
		expect(Object.keys(input)).toEqual(Object.keys(before));
		for (const key of Object.keys(input)) {
			expect(Object.getOwnPropertyDescriptor(input, key)).toStrictEqual(before[key]);
		}
		const parsed = v.parse(exportedAntenna, input);
		for (const key of ['__proto__', 'constructor', 'prototype']) {
			expect(Object.hasOwn(parsed, key)).toBe(true);
			expect(parsed[key]).toStrictEqual(input[key]);
		}
	});
	it('does not default absent optional fields', () => {
		const input = valid();
		expect(validate(input)).toBe(true);
		for (const key of ['userListAccts', 'localOnly', 'excludeBots', 'excludeNotesInSensitiveChannel']) {
			expect(Object.hasOwn(input, key)).toBe(false);
			expect(Object.hasOwn(v.parse(exportedAntenna, input), key)).toBe(false);
		}
	});
	it('infers the export DTO directly and retains Required exporter checking', () => {
		expectTypeOf<ExportedAntenna>().toEqualTypeOf<v.InferOutput<typeof exportedAntenna>>();
		const emitted = { ...valid(), userListAccts: null, localOnly: false, excludeBots: false, excludeNotesInSensitiveChannel: true } satisfies Required<ExportedAntenna>;
		expect(validate(emitted)).toBe(true);
		expectTypeOf<ExportedAntenna['userListAccts']>().toEqualTypeOf<string[] | null | undefined>();
		expectTypeOf<ExportedAntenna['localOnly']>().toEqualTypeOf<boolean | undefined>();
		// @ts-expect-error The portable artifact still requires its name.
		const missingName: ExportedAntenna = { src: 'all', keywords: [], excludeKeywords: [], users: [], caseSensitive: false, withReplies: false, withFile: false };
		// @ts-expect-error Historical source options are a closed union.
		const invalidSource: ExportedAntenna = { ...valid(), src: 'other' };
		// @ts-expect-error Known optional values retain their native types.
		const invalidOptional: ExportedAntenna = { ...valid(), localOnly: null };
		// @ts-expect-error The exporter must provide every optional artifact field.
		const incompleteExport: Required<ExportedAntenna> = valid();
		void [missingName, invalidSource, invalidOptional, incompleteExport];
	});
});
