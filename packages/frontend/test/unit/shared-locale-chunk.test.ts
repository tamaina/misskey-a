/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { assertNoLegacyLabels } from '../../lib/vite-plugin-no-legacy-labels.js';

const facade = { fileName: 'scripts/i18n.js', code: 'export { r as i18n } from "./shared.js";' };
const shared = { fileName: 'scripts/shared.js', code: 'export const r = {}; export const o = {};' };

function validate(consumer: string) {
	const chunks = [facade, shared, { fileName: 'scripts/client.js', code: consumer }];
	const original = chunks.map(chunk => chunk.code);
	try {
		assertNoLegacyLabels(chunks, facade.fileName);
	} finally {
		expect(chunks.map(chunk => chunk.code)).toEqual(original);
	}
}

test('allows owner-only imports from a shared locale chunk', () => {
	expect(() => validate('import { o as owner } from "./shared.js"; export const label = owner.$locale.title;')).not.toThrow();
});

test.each(['locale.ts.notifications', 'locale.tsx.withNFiles({ n: 2 })'])('rejects mixed legacy and owner imports: %s', expression => {
	expect(() => validate(`import { r as locale, o as owner } from "./shared.js"; export const label = ${expression}; export const ownerLabel = owner.$locale.title;`)).toThrow('Legacy labels remain');
});

test('rejects sole legacy imports through a shared chunk alias', () => {
	expect(() => validate('import { r as locale } from "./shared.js"; export const label = locale.ts.notifications;')).toThrow('Legacy labels remain');
});

test('rejects unsupported direct legacy dictionary uses', () => {
	expect(() => validate('import { r as locale, o as owner } from "./shared.js"; export { locale, owner };')).toThrow('Legacy label validation failed');
});

test('allows VVI-only chunks without requiring any legacy labels', () => {
	expect(() => validate('export const label = "A VVI-owned label";')).not.toThrow();
});

test('ignores locally shadowed aliases', () => {
	expect(() => validate('import { r as locale } from "./shared.js"; export function label(locale) { return locale.ts.title; }')).not.toThrow();
});
