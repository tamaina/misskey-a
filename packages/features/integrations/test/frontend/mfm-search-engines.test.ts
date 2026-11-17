/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { SEARCH_ENGINES, SEARCH_ENGINE_IDS, buildSearchUrl, isValidCustomSearchUrl, searchEngineName } from '../../frontend/utility/mfm-search-engines.js';
const query = '日本語 &x=1 #/?+% "😀';
for (const id of SEARCH_ENGINE_IDS) {
	test(`built-in ${id} encodes exactly one search value`, () => {
		const url = new URL(buildSearchUrl(id, '', query));
		expect([...url.searchParams.values()]).toEqual([query]);
		expect(url.hash).toBe('');
		expect(searchEngineName(id, '')).toBe(SEARCH_ENGINES[id].name);
	});
}
for (const template of ['https://example.com/find/{query}', 'https://example.com/?q={query}', 'http://localhost:8888/#q={query}', 'https://example.com/{query}?q={query}#{query}']) {
	test(`custom URL ${template} encodes placeholders`, () => {
		expect(isValidCustomSearchUrl(template)).toBe(true);
		expect(buildSearchUrl('custom', template, query)).toBe(new URL(template.replaceAll('{query}', encodeURIComponent(query))).href);
		expect(searchEngineName('custom', template)).toBe(new URL(template).hostname);
	});
}
for (const template of ['', 'javascript:alert({query})', 'data:text/html,{query}', 'file:///{query}', '//example.com/{query}', '/search?q={query}', 'https://{query}.example.com/', 'https://example.com:{query}/', 'https://{query}@example.com/', 'https://user:{query}@example.com/', 'https://user:secret@example.com/?q={query}', 'https://example.com/?q=missing', 'https://exam\nple.com/?q={query}', null, {}, 3]) {
	test(`invalid custom URL falls back safely: ${JSON.stringify(template)}`, () => {
		expect(isValidCustomSearchUrl(template)).toBe(false);
		expect(buildSearchUrl('custom', template, query)).toBe(buildSearchUrl('google', '', query));
		expect(searchEngineName('custom', template)).toBe('Google');
	});
}
for (const id of ['__proto__', 'constructor', 'unknown', null, {}]) {
	test(`unknown engine ${String(id)} falls back to Google`, () => {
		expect(buildSearchUrl(id, '', query)).toBe(buildSearchUrl('google', '', query));
		expect(searchEngineName(id, '')).toBe('Google');
	});
}
test('malformed imported UTF-16 does not throw or change URL structure', () => {
	const url = new URL(buildSearchUrl('google', '', '\ud800&x=1'));
	expect(url.searchParams.get('q')).toBe('�&x=1');
	expect(url.searchParams.has('x')).toBe(false);
});
