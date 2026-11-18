/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { cardStyles } from './anki-card-css.js';
import SourceContent from './components/SourceContent.vue';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
const i18n = createInternationalization({ initialLocale: 'ja-JP' });
beforeAll(async () => {
	// happy-dom omits compatMode. Misskey and the card iframe both use an HTML5 doctype.
	if (!window.document.compatMode) Object.defineProperty(window.document, 'compatMode', { configurable: true, value: 'CSS1Compat' });
	await i18n.ready;
});
afterEach(cleanup);
const global = { plugins: [i18n] };

test('retains literal typography from the upstream APKG and drops other rules', () => {
	const css = '.card{color:rgb(12,34,56)}.custom{font-weight:bold;background-image:linear-gradient(red,blue)}';
	const clean = cardStyles(css);
	expect(clean).toContain('.custom{font-weight:bold}');
	expect(clean).toMatch(/\.card\{color:rgb\(12,\s*34,\s*56\)\}/);
	expect(cardStyles('@media screen { .card{color:red} }')).toBe('');
	expect(cardStyles('.a:hover{color:blue}')).toBe('');
	expect(cardStyles(' '.repeat(65_537) + css)).toBe('');
});

test('renders upstream text delimiters as MathML and keeps code, currency and stale text literal', async () => {
	const value = String.raw`<p>\(x^2\)</p><p>\[a+b\]</p><p>$$c+d$$</p><code>\(code\)</code><p>$5</p>`;
	const { container, rerender } = render(SourceContent, { global, props: { content: { format: 'html', value } } });
	await waitFor(() => expect(container.querySelectorAll('math')).toHaveLength(3));
	expect(container.querySelectorAll('math[display="block"]')).toHaveLength(2);
	expect(container.querySelector('code')?.textContent).toBe(String.raw`\(code\)`);
	expect(container.textContent).toContain('$5');
	const invalid = String.raw`\(\undefinedFukushuCommand\)`;
	await rerender({ content: { format: 'plain', value: invalid } });
	expect(container.textContent).toBe(invalid);
	await rerender({ content: { format: 'plain', value: 'Next card' } });
	expect(container.querySelector('math')).toBeNull();
	expect(container.textContent).toBe('Next card');
});
