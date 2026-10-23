/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { evaluateStaticSearchExpression } from '../../../lib/static-search-expression.js';

const moduleId = '/features/settings/frontend/pages/settings/privacy.vue';
test('preserves static locale references and literal search metadata', () => {
	expect(evaluateStaticSearchExpression("[$locale.sfc['2fa'], i18n.ts._privacy.title, 'literal']", moduleId)).toEqual([
		"${createComponentLocale('/features/settings/frontend/pages/settings/privacy.vue')['2fa']}",
		"${i18n.ts['_privacy'].title}",
		'literal',
	]);
	expect(evaluateStaticSearchExpression('(($locale.sfc.description))', moduleId)).toBe("${createComponentLocale('/features/settings/frontend/pages/settings/privacy.vue').description}");
	expect(evaluateStaticSearchExpression('[true, false, null, 42, `literal`]')).toEqual([true, false, null, 42, 'literal']);
});

test.each([
	'setting.label', 'setting.caption', '$locale.sfc[setting.key]', '$locale.sfc?.label',
	'$locale.global.label', '[...labels]', '["valid", setting.label]', '(() => "label")()',
	'globalThis.__searchExpressionExecuted = true', 'i18n.ts.label; globalThis.__searchExpressionExecuted = true',
	'globalThis.__searchExpressionExecuted()', 'i18n.ts.label + "suffix"', '$locale.sfc["broken]',
])('skips unsupported expression without executing it: %s', expression => {
	let executed = false;
	Object.defineProperty(globalThis, '__searchExpressionExecuted', { configurable: true, get: () => { executed = true; return () => { executed = true; }; }, set: () => { executed = true; } });
	try {
		expect(evaluateStaticSearchExpression(expression, moduleId)).toBeUndefined();
		expect(executed).toBe(false);
	} finally {
		Reflect.deleteProperty(globalThis, '__searchExpressionExecuted');
	}
});
