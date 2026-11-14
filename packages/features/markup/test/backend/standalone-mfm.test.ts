/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import { mfmStyles } from '../../frontend/shared/mfm-styles.js';
import { renderStandaloneMfm } from '../../backend/standalone-mfm.js';

const options = { instanceUrl: 'https://local.example', locale: 'en-US', timeZone: 'UTC' };

describe('standalone Vue MFM renderer', () => {
	test('renders in Node without browser state and resolves local resources', async () => {
		const result = await renderStandaloneMfm('@alice #tag :local: :missing: 😀', { ...options, emojiUrls: { local: '/emoji/local.webp' } });
		expect(result.html).toContain('href="https://local.example/@alice"');
		expect(result.html).toContain('href="https://local.example/tags/tag"');
		expect(result.html).toContain('src="https://local.example/emoji/local.webp"');
		expect(result.html).toContain(':missing:');
		expect(result.resources).toEqual([{ url: 'https://local.example/emoji/local.webp', kind: 'emoji' }]);
	});

	test('preserves shared effects, nesting, theme and static sparkle', async () => {
		const result = await renderStandaloneMfm('$[x2 $[x3 large]] $[spin spin] $[jump jump] $[bounce bounce] $[sparkle shine] $[fg.color=123456 color] $[border border]', { ...options, theme: { accent: '#123456' } });
		expect(result.html).toContain('mfm-spin');
		expect(result.html).toContain('mfm-sparkle');
		expect(result.html).toContain('#123456');
		expect(result.css).toContain('@keyframes mfm-bounce');
		expect(result.css).toContain('.misskey-mfm .mfm-x2');
		expect(result.html).not.toContain('var(--MI_THEME-');
		expect(result.html).toContain('font-size: 200%');
	});

	test('escapes content and excludes active URLs and CSS injection', async () => {
		const result = await renderStandaloneMfm('<script>alert(1)</script> :evil: [safe](javascript:alert)\n```html\n<img onerror=x>\n```', { ...options, emojiUrls: { evil: 'javascript:alert(1)' } });
		expect(result.html).not.toContain('<script');
		expect(result.html).not.toContain('src="javascript:');
		expect(result.html).not.toContain('href="javascript:');
		expect(result.html).toContain('&lt;img onerror=x&gt;');
		await expect(renderStandaloneMfm('text', { ...options, theme: { bg: 'red;</style><script>' } })).rejects.toThrow('hexadecimal');
	});

	test('resolves syntax highlighting before SSR, escapes plain highlighter text', async () => {
		const highlight = async () => h('span', { style: 'color: #ff0000' }, '<safe>');
		const result = await renderStandaloneMfm('```js\nconst x = 1\n```', { ...options, highlight });
		expect(result.html).toContain('&lt;safe&gt;');
		expect(result.html).toContain('color: #ff0000');
	});

	test('formats time deterministically and disables animation on request', async () => {
		const a = await renderStandaloneMfm('$[unixtime 0] $[spin text] $[clickable.ev=1 readable]', { ...options, animated: false });
		const b = await renderStandaloneMfm('$[unixtime 0] $[spin text] $[clickable.ev=1 readable]', { ...options, animated: false });
		expect(a.html).toBe(b.html);
		expect(a.html).toContain('1970-01-01T00:00:00.000Z');
		expect(a.html).not.toContain('onclick');
		expect(a.html).not.toContain('animation: mfm-spin');
	});
});

// These are regression cases for data that merely resembles styling or object keys.
test('preserves literal theme-variable prose and URLs while resolving style attributes', async () => {
	const result = await renderStandaloneMfm('var(--MI_THEME-fg) [link](https://example.test/var(--MI_THEME-accent))\n$[border framed]', options);
	expect(result.html).toContain('var(--MI_THEME-fg)');
	expect(result.html).toContain('https://example.test/var(--MI_THEME-accent)');
	expect(result.html).toContain('border: 1px solid #86b300');
});

test('rejects inherited/non-string emoji resources and credential-bearing URLs', async () => {
	const result = await renderStandaloneMfm(':constructor: :toString: :credential: :svg:', { ...options, emojiUrls: { credential: 'https://user:secret@host.test/image.png', svg: 'data:image/svg+xml,<svg onload=alert(1)>' } });
	expect(result.resources).toEqual([]);
	expect(result.html).not.toContain('<img');
});

test('keeps the configured scheme and IPv6 authority for local mention links', async () => {
	const result = await renderStandaloneMfm('@alice', { instanceUrl: 'http://[::1]:3000' });
	expect(result.html).toContain('href="http://[::1]:3000/@alice"');
});

test('Node stylesheet exactly matches the canonical static browser stylesheet', async () => {
	const css = await readFile(new URL('../../frontend/shared/mfm.css', import.meta.url), 'utf8');
	expect(mfmStyles).toBe(css);
});

test('animated false renders sparkle as readable text without any animated wrapper', async () => {
	const result = await renderStandaloneMfm('$[sparkle static stars]', { ...options, animated: false });
	const body = result.html.slice(result.html.indexOf('</style>') + '</style>'.length);
	expect(body).toContain('static stars');
	expect(body).not.toContain('mfm-sparkle');
	expect(body).not.toContain('animation:');
});
