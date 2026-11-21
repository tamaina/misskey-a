/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { cardStyles } from './anki-card-css.js';
import SourceContent from './components/SourceContent.vue';
import StaticAnkiCard from './components/StaticAnkiCard.vue';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
const i18n = createInternationalization({ initialLocale: 'ja-JP' });
beforeAll(async () => {
	// happy-dom omits compatMode. Misskey and the card iframe both use an HTML5 doctype.
	if (!window.document.compatMode) Object.defineProperty(window.document, 'compatMode', { configurable: true, value: 'CSS1Compat' });
	await i18n.ready;
});
afterEach(() => { cleanup(); vi.mocked(misskeyApi).mockReset(); });
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

test('native static Anki cards use an opaque iframe and rebuild only inert markup', () => {
	const { container } = render(StaticAnkiCard, { global, props: {
		fallback: 'front',
		html: '<section class="custom"><strong>Hello</strong><img alt="inert"><form>hidden</form><a title="removed">link caption</a></section><table><tbody><tr><td colspan="2" rowspan="42">Cell</td></tr></tbody></table>',
		css: '.custom{font-weight:bold}',
	} });
	const frame = container.querySelector('iframe')!;
	const generated = frame.getAttribute('srcdoc')!;
	expect(frame.getAttribute('sandbox')).toBe('');
	expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer');
	expect(generated).toContain("default-src 'none'");
	expect(generated).toContain("connect-src 'none'");
	expect(generated).toContain('<section class="custom"><strong>Hello</strong>link caption</section>');
	expect(generated).toContain('.custom{font-weight:bold}');
	expect(generated).toContain('<td colspan="2">Cell</td>');
	expect(generated).not.toMatch(/<(img|form|a)\b/);
});

const testPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yXt8AAAAASUVORK5CYII=';
const testWav = 'UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==';

function attachment(mimeType: 'image/png' | 'audio/wav', data: string) {
	return { mimeType, data, id: bytesToHex(sha256(Uint8Array.from(atob(data), char => char.charCodeAt(0)))) };
}

test('loads only selected private attachments and never places audio or external URLs in the card iframe', async () => {
	const png = attachment('image/png', testPng);
	const wav = attachment('audio/wav', testWav);
	const { container, getByRole } = render(StaticAnkiCard, { global, props: {
		fallback: 'prompt', deckId: 'deck',
		html: `<img alt="study image" src="fukushu-media:${png.id}" onload="unsafe()"><audio autoplay src="fukushu-media:${wav.id}"></audio><img alt="raw source" src="https://example.invalid/a.png"><img src="data:image/png;base64,${testPng}">`,
	} });
	const html = () => container.querySelector('iframe')!.getAttribute('srcdoc')!;
	expect(html()).toContain("img-src 'none'");
	expect(html()).toContain('study image');
	expect(html()).not.toContain('data:image/png');
	expect(container.querySelector('audio')).toBeNull();
	expect(misskeyApi).not.toHaveBeenCalled();
	vi.mocked(misskeyApi).mockResolvedValueOnce(png as never).mockResolvedValueOnce(wav as never);
	await fireEvent.click(getByRole('button', { name: '画像を表示' }));
	await waitFor(() => expect(html()).toContain(`<img alt="study image" src="data:image/png;base64,${testPng}"`));
	expect(container.querySelector('iframe')?.getAttribute('sandbox')).toBe('');
	expect(html()).toContain('img-src data:');
	expect(html()).toContain("media-src 'none'");
	expect(html()).not.toMatch(/https:|<audio\b|onload|autoplay/);
	expect(container.querySelector('audio')).toBeNull();
	await fireEvent.click(getByRole('button', { name: '音声を読み込む' }));
	await waitFor(() => expect(container.querySelector('audio')?.getAttribute('src')).toBe('data:audio/wav;base64,' + testWav));
	expect(container.querySelector('audio')?.hasAttribute('autoplay')).toBe(false);
	expect(container.querySelector('audio')?.hasAttribute('controls')).toBe(true);
	expect(container.querySelector('audio')?.getAttribute('preload')).toBe('none');
	expect(vi.mocked(misskeyApi).mock.calls.map(([name, input]) => [name, input])).toEqual([
		['fukushu/materials/anki-media', { id: 'deck', mediaId: png.id }],
		['fukushu/materials/anki-media', { id: 'deck', mediaId: wav.id }],
	]);
});

test('rejects mismatched content and aborts an attachment that would arrive on another card', async () => {
	const png = attachment('image/png', testPng);
	const { container, getByRole, findByRole, rerender } = render(StaticAnkiCard, { global, props: {
		fallback: 'prompt', deckId: 'deck',
		html: `<img src="fukushu-media:${png.id}">`,
	} });
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...png, data: testWav } as never);
	await fireEvent.click(getByRole('button', { name: '画像を表示' }));
	await findByRole('alert');
	expect(container.querySelector('iframe')?.getAttribute('srcdoc')).not.toContain('data:image/png');

	let respond!: (value: never) => void;
	vi.mocked(misskeyApi).mockImplementationOnce(() => new Promise(resolve => { respond = resolve; }));
	await fireEvent.click(getByRole('button', { name: '画像を表示' }));
	const signal = vi.mocked(misskeyApi).mock.calls[1][3];
	await rerender({ deckId: 'next-deck', html: '<p>Next card</p>' });
	expect(signal?.aborted).toBe(true);
	respond(png as never);
	await waitFor(() => expect(container.querySelector('iframe')?.getAttribute('srcdoc')).toContain('<p>Next card</p>'));
	expect(container.querySelector('iframe')?.getAttribute('srcdoc')).not.toContain('data:image/png');
});
