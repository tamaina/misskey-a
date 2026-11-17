/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSSRApp, defineComponent, h, nextTick, reactive, watchEffect } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, describe, expect, test, vi } from 'vitest';
import katex from 'katex';
import FormulaCore from '../../frontend/shared/MkFormulaCore.vue';
import Formula from '../../frontend/shared/MkFormula.vue';
import { isFormulaTooComplex, isLatexEnabled } from '../../frontend/shared/formula-safety.js';
import { createMfmRenderer } from '../../frontend/shared/mfm-renderer.js';

vi.mock('@features/boot/frontend/shared/config.js', () => ({ host: 'synthetic.invalid' }));
afterEach(() => vi.restoreAllMocks());

async function core(formula: string, block = false) {
	const html = await renderToString(createSSRApp({ render: () => h(FormulaCore, { formula, block }) }));
	const root = window.document.createElement('div');
	root.innerHTML = html;
	return root;
}

describe('safe shared formula rendering', () => {
	test.each([undefined, null, {}, { latexEnabled: false }, { latexEnabled: 'true' }, { latexEnabled: 1 }, Object.create({ latexEnabled: true })])('defaults off for malformed or missing options %j', options => {
		expect(isLatexEnabled(options)).toBe(false);
	});
	test('only an explicit boolean enables rendering', () => {
		expect(isLatexEnabled({ latexEnabled: true, unrelated: 'preserved' })).toBe(true);
	});
	test('reacts when the initially absent setting is enabled or removed', async () => {
		const options = reactive<Record<string, unknown>>({});
		let enabled = false;
		const stop = watchEffect(() => { enabled = isLatexEnabled(options); });
		options.latexEnabled = true;
		await nextTick();
		expect(enabled).toBe(true);
		delete options.latexEnabled;
		await nextTick();
		expect(enabled).toBe(false);
		stop();
	});
	test('retains the upstream input-length and brace-depth boundaries', () => {
		expect(isFormulaTooComplex('x'.repeat(1000))).toBe(false);
		expect(isFormulaTooComplex('x'.repeat(1001))).toBe(true);
		expect(isFormulaTooComplex('{{{x}}}')).toBe(false);
		expect(isFormulaTooComplex('{{{{x}}}}')).toBe(true);
	});
	test('distinguishes inline/block math and includes accessible MathML', async () => {
		const inline = await core('\\sum_{i=1}^{n} i');
		const block = await core('\\sum_{i=1}^{n} i', true);
		expect(inline.querySelector('.katex')).not.toBeNull();
		expect(inline.querySelector('.katex-display')).toBeNull();
		expect(block.querySelector('.katex-display')).not.toBeNull();
		expect(block.querySelector('math')?.getAttribute('display')).toBe('block');
	});
	test.each(['\\invalid{<img src=x onerror=alert(1)>}', '\\frac{1}{', '\\def\\a{\\a}\\a', 'x'.repeat(1001), '{{{{x}}}}'])('falls back to escaped source on invalid/complex input %s', async input => {
		const root = await core(input, true);
		expect(root.querySelector('pre')?.textContent).toBe(input);
		expect(root.querySelector('.katex, img, script')).toBeNull();
	});
	test.each(['\\href{https://example.invalid}{click}', '\\url{javascript:alert(1)}', '\\includegraphics{https://example.invalid/x.png}', '\\htmlStyle{position:fixed}{x}'])('does not trust external resources or HTML extensions %s', async input => {
		const root = await core(input);
		expect(root.querySelector('a, img, script, iframe, [style*="position:fixed"]')).toBeNull();
	});
	test('caps visual dimensions and does not share user-defined macros between formulas', async () => {
		const root = await core('\\rule{999em}{999em}');
		expect(root.querySelector('.katex')).not.toBeNull();
		expect(root.innerHTML).not.toContain('999em;');
		expect(root.innerHTML).toContain('20em');
		await core('\\gdef\\myformula{X}\\myformula');
		expect((await core('\\myformula')).querySelector('code')?.textContent).toBe('\\myformula');
	});
	test('never inserts oversized generated HTML or renderer exception messages', async () => {
		const render = vi.spyOn(katex, 'renderToString').mockReturnValue('<b>'.repeat(40_000));
		expect((await core('x')).textContent).toBe('x');
		render.mockImplementation(() => { throw new Error('<script>unsafe exception</script>'); });
		const failed = await core('y');
		expect(failed.querySelector('code')?.textContent).toBe('y');
		expect(failed.querySelector('script')).toBeNull();
		expect(failed.textContent).not.toContain('unsafe exception');
	});
	test('shares one optional formula path and preserves absent/disabled fallback', async () => {
		const stub = defineComponent({ render: () => h('span') });
		const components = { Url: stub, Link: stub, Mention: stub, A: stub, Time: stub, Emoji: stub, CustomEmoji: stub };
		for (const enabled of [false, true]) {
			for (const supplied of [false, true]) {
				const renderer = createMfmRenderer({ components: () => ({ ...components, ...(supplied ? { Formula } : {}) }), getOptions: () => ({ advancedMfm: false, animatedMfm: false, latexEnabled: enabled }) });
				const html = await renderToString(createSSRApp({ render: () => h(renderer, { text: '\\(x\\)\n\\[\ny\n\\]' }) }));
				expect(html.includes('class="katex"')).toBe(enabled && supplied);
				if (!enabled || !supplied) expect(html).toContain('<code>x</code>');
				if (enabled && supplied) expect(html).toContain('katex-display');
			}
		}
	});
});
