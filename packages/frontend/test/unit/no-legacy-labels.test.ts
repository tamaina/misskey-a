/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { assertNoLegacyLabels } from '../../lib/vite-plugin-no-legacy-labels.js';

const runtime = { fileName: 'scripts/i18n.js', code: 'export const i18n = {};' };

test.each(['alias.ts.title', 'alias.tsx.greeting({ name: "test" })'])('rejects emitted legacy label use: %s', expression => {
	expect(() => assertNoLegacyLabels([runtime, { fileName: 'scripts/app.js', code: `import { i18n as alias } from "./i18n.js"; console.log(${expression});` }], runtime.fileName)).toThrow('Legacy labels remain');
});

test('resolves renamed facade exports before rejecting legacy labels', () => {
	const facade = { fileName: 'scripts/facade.js', code: 'import { internal as renamed } from "./shared.js"; export { renamed as i18n };' };
	expect(() => assertNoLegacyLabels([facade, { fileName: 'scripts/shared.js', code: 'export const internal = {};' }, { fileName: 'scripts/app.js', code: 'import { internal as labels } from "./shared.js"; console.log(labels.ts.title);' }], facade.fileName)).toThrow('Legacy labels remain');
});

test('allows VVI labels, unused legacy imports and retained catalog fetching without modifying chunks', () => {
	const chunks = [runtime, { fileName: 'scripts/app.js', code: 'import { i18n } from "./i18n.js"; const owner = { ts: { title: "VVI" } }; console.log(owner.ts.title); await window.fetch(`/assets/locales/${lang}.${version}.json`).then(r => r.json());' }];
	const original = chunks.map(chunk => chunk.code);
	expect(() => assertNoLegacyLabels(chunks, runtime.fileName)).not.toThrow();
	expect(chunks.map(chunk => chunk.code)).toEqual(original);
});

test('fails closed when chunk parsing or i18n entry validation fails', () => {
	expect(() => assertNoLegacyLabels([], runtime.fileName)).toThrow('Missing legacy i18n entry');
	expect(() => assertNoLegacyLabels([runtime, { fileName: 'scripts/app.js', code: 'not valid javascript @' }], runtime.fileName)).toThrow('Legacy label validation failed');
});
