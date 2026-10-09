/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { h, render, toDisplayString } from 'vue';
import * as v from 'valibot';
import { rssCopiedXmlValueSchema } from '@features/integrations/backend/endpoints/fetch-rss.contract.js';
import { isAllowedRssLink, rssDomAttribute } from '@features/web/frontend/shared/rss-value.js';

// A parser-owned dynamic XML key may shadow Object.toString; validate the actual JSON fixture.
const shadowedToString: unknown = JSON.parse('{"toString":["xml"]}');
const values: Parameters<typeof isAllowedRssLink>[0][] = [undefined, '', 'https://example.com/item', '/item', 'javascript:alert(1)', { $: { lang: 'en' } }, { nested: ['xml'] }, v.parse(rssCopiedXmlValueSchema, shadowedToString)];
const base = 'https://example.com';

describe('RSS XML value coercion', () => {
	test.each(values)('URL allowance matches the existing native URL coercion: %j', value => {
		let allowed = false;
		if (value) {
			try {
				const parsed: URL = Reflect.construct(URL, [value, base]);
				allowed = ['http:', 'https:'].includes(parsed.protocol);
			} catch { /* Existing tryParseUrl returns null. */ }
		}
		expect(isAllowedRssLink(value, base)).toBe(allowed);
	});

	test.each(values.slice(0, -1))('DOM attributes and rendered title preserve Vue coercion: %j', value => {
		const container = document.createElement('div');
		render(h('a', { href: value, title: value }, toDisplayString(value)), container);
		const original = container.innerHTML;
		render(null, container);
		render(h('a', { href: rssDomAttribute(value), title: rssDomAttribute(value) }, toDisplayString(value)), container);
		expect(container.innerHTML).toBe(original);
		render(null, container);
	});
});
