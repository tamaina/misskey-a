/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';
import { generateSearchIndexModule } from '../../../lib/search-index-codegen.js';
import { evaluateStaticSearchExpression } from '../../../lib/static-search-expression.js';

test.each([
	['i18n.ts.title', true, 'Legacy title'],
	["i18n.ts['2fa']", true, 'Two-factor title'],
	['$locale.sfc.title', false, 'Component title'],
	["'Static title'", false, 'Static title'],
])('search module retains labels and imports only the used runtime: %s', (expression, needsI18n, expected) => {
	const label = evaluateStaticSearchExpression(expression, '/fixture.vue') as string;
	const generated = generateSearchIndexModule([{ id: 'fixture', label, keywords: [], texts: [] }]);
	expect(generated.includes("import { i18n } from '@features/runtime/frontend/i18n.js';")).toBe(needsI18n);
	const executable = generated.replace(/^import .*;\n/gm, '').replace('export const searchIndexes =', 'globalThis.searchIndexes =');
	const context = {
		i18n: { ts: { title: 'Legacy title', '2fa': 'Two-factor title' } },
		createComponentLocale: () => ({ title: 'Component title' }),
	};
	runInNewContext(executable, context);
	expect(context).toMatchObject({ searchIndexes: [{ id: 'fixture', label: expected, keywords: [], texts: [] }] });
});
