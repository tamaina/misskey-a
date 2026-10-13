/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';
import { compileTargets, installCustomCss, targets } from '../unit/legacy-css-fixtures.js';

const userCss = `.xct11 { font-family: GenEiUniverSans-w, SourceHanSans-w; font-weight: 700; }
${targets.filter(target => target[2] !== 'xct11').map(target => `.${target[2]}`).join(',')} {
 font-family: GenEiAntique-w, GenEiAntique-P-w, SourceHanSans-w;
 font-feature-settings: "palt";
 font-weight: 500;
}`;

test('all legacy font targets survive lazy CSS in the real browser cascade', async ({ page }) => {
	const { js, css } = await compileTargets('/tmp/browser-css-release/packages/frontend');
	await page.setContent('<!doctype html><head></head><body></body>');
	await page.addScriptTag({ content: readFileSync(createRequire(import.meta.url).resolve('vue/dist/vue.runtime.global.prod.js'), 'utf8') });
	await page.addScriptTag({ content: js + `
for (const component of CompatFixtures) {
 const host = document.createElement('div'); document.body.append(host);
 const app = Vue.createApp(component);
 app.component('Mfm', { render() { return Vue.h('span', this.$attrs, this.$slots.default?.()); } });
 app.component('MkA', { render() { return Vue.h('a', this.$attrs, this.$slots.default?.()); } });
 app.mount(host);
}` });
	// Reproduce pre-fix loader order with actual compiled component CSS.
	await page.addStyleTag({ content: userCss });
	await page.addStyleTag({ content: css });
	const textarea = page.locator('textarea.x8B0D');
	expect(await textarea.evaluate(node => getComputedStyle(node).fontFamily)).not.toContain('GenEiAntique-w');
	expect(await textarea.evaluate(node => getComputedStyle(node).fontWeight)).toBe('500');
	await page.evaluate(({ boot, saved }) => { new Function('isSafeMode', 'localStorage', boot)(false, { getItem: () => saved }); }, { boot: installCustomCss, saved: userCss });
	// Loading another lazy stylesheet exercises the fix, not just initial order.
	await page.addStyleTag({ content: css });
	for (const [, , selector] of targets) {
		const node = page.locator(`[data-target="${selector}"]`);
		await expect(node).toHaveClass(new RegExp(`\\b${selector}\\b`));
		await expect.poll(() => node.evaluate(node => getComputedStyle(node).fontFamily)).toContain(selector === 'xct11' ? 'GenEiUniverSans-w' : 'GenEiAntique-w');
		expect(await node.evaluate(node => getComputedStyle(node).fontWeight)).toBe(selector === 'xct11' ? '700' : '500');
		if (selector !== 'xct11') expect(await node.evaluate(node => getComputedStyle(node).fontFeatureSettings)).toContain('palt');
	}
});
