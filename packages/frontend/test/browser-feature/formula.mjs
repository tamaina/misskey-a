/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import { chromium, expect } from '@playwright/test';
import { pluginVvi } from '../../lib/vite-plugin-vvi.ts';
import { pluginFeatureDependencies } from '../../lib/vite-plugin-feature-dependencies.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixture = resolve(root, 'test/browser-feature/fixture');
const output = await mkdtemp(resolve(tmpdir(), 'misskey-formula-browser-'));
let server;
let browser;
try {
	const stub = resolve(fixture, 'FormulaFormStub.vue');
	const components = ['markup/frontend/components/global/MkUrl.vue', 'ui/frontend/components/global/MkTime.vue', 'navigation/frontend/components/MkLink.vue', 'users/frontend/components/MkMention.vue', 'emojis/frontend/components/global/MkEmoji.vue', 'emojis/frontend/components/global/MkCustomEmoji.vue', 'markup/frontend/components/MkCode.vue', 'markup/frontend/components/MkCodeInline.vue', 'integrations/frontend/components/MkGoogle.vue', 'ui/frontend/components/MkSparkle.vue', 'navigation/frontend/components/global/MkA.vue', 'markup/frontend/embed/components/EmUrl.vue', 'ui/frontend/embed/components/EmTime.vue', 'navigation/frontend/embed/components/EmLink.vue', 'users/frontend/embed/components/EmMention.vue', 'emojis/frontend/embed/components/EmEmoji.vue', 'emojis/frontend/embed/components/EmCustomEmoji.vue', 'navigation/frontend/embed/components/EmA.vue', ...['MkInput', 'MkTextarea', 'MkColorInput', 'MkRadios', 'MkSwitch'].map(name => `ui/frontend/components/${name}.vue`)];
	const result = await build({ root, configFile: false, logLevel: 'warn', plugins: [pluginFeatureDependencies(root, resolve(root, '../features')), pluginVvi(), vue()],
																														resolve: { dedupe: ['vue', 'vite-vue-internationalization'], alias: [
																															...['instance/frontend/instance.js', 'instance/frontend/embed/server-metadata.js', 'preferences/frontend/preferences.js', 'api/frontend/utility/misskey-api.js', 'ui/frontend/os.js', 'auth/frontend/i.js', 'navigation/frontend/page.js', 'boot/frontend/shared/config.js'].map(name => ({ find: `@features/${name}`, replacement: resolve(fixture, 'formula-adapters.js') })),
																															...components.map(name => ({ find: `@features/${name}`, replacement: stub })),
																															{ find: '@features/ui/frontend/components/MkButton.vue', replacement: resolve(fixture, 'Button.vue') },
																															{ find: '@features', replacement: resolve(root, '../features') },
																															{ find: '@', replacement: resolve(root, 'src') },
																														] }, build: { outDir: output, emptyOutDir: true, target: 'esnext', rolldownOptions: { input: resolve(fixture, 'formula.html') } } });
	const artifacts = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
	const html = artifacts.find(item => item.fileName.endsWith('.html'));
	const core = artifacts.find(item => item.type === 'chunk' && item.facadeModuleId?.endsWith('/MkFormulaCore.vue'));
	assert.ok(html && core, 'FormulaCore must remain a separate lazy chunk');
	server = await preview({ root, configFile: false, build: { outDir: output }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
	const address = server.httpServer.address(); assert.ok(address && typeof address === 'object');
	const origin = `http://127.0.0.1:${address.port}`;
	browser = await chromium.launch({ headless: true, ...(process.env.MISSKEY_TEST_CHROMIUM ? { executablePath: process.env.MISSKEY_TEST_CHROMIUM } : {}) });
	const page = await browser.newPage();
	const errors = []; const external = []; const coreRequests = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.route('**/*', route => {
		const url = route.request().url();
		if (!url.startsWith(`${origin}/`)) { external.push(url); return route.abort(); }
		if (url.endsWith(core.fileName)) coreRequests.push(url);
		return route.continue();
	});
	await page.goto(`${origin}/${html.fileName}`);
	await expect(page.getByText('Disabled (default)', { exact: true })).toBeVisible();
	assert.equal(await page.locator('.katex').count(), 0);
	assert.equal(coreRequests.length, 0, 'Disabled renderer must not load KaTeX');
	await page.getByText('Disabled (default)', { exact: true }).dispatchEvent('mousedown');
	await page.locator('#menu').getByRole('button', { name: 'Enabled', exact: true }).click();
	await page.getByRole('button', { name: 'Save', exact: true }).click();
	for (const id of ['normal', 'embed']) {
		await expect(page.locator(`#${id} .katex-display`)).toHaveCount(1);
		assert.equal(await page.locator(`#${id} a, #${id} img`).count(), 0);
		assert.ok((await page.locator(`#${id} code`).innerText()).includes('<img src=x>'));
	}
	const requests = JSON.parse(await page.locator('#requests').innerText());
	assert.equal(requests[0].route, 'admin/update-meta');
	assert.equal(requests[0].input.clientOptions.latexEnabled, true);
	assert.ok(coreRequests.length > 0);
	if (process.env.FORMULA_SCREENSHOT_DIR) {
		await mkdir(process.env.FORMULA_SCREENSHOT_DIR, { recursive: true });
		await page.screenshot({ path: resolve(process.env.FORMULA_SCREENSHOT_DIR, 'formula-enabled.png'), fullPage: true });
	}
	await page.reload();
	await expect(page.locator('#embed .katex-display')).toHaveCount(1);
	await page.getByText('Enabled', { exact: true }).dispatchEvent('mousedown');
	await page.locator('#menu').getByRole('button', { name: 'Disabled (default)', exact: true }).click();
	await page.getByRole('button', { name: 'Save', exact: true }).click();
	await expect(page.locator('.katex')).toHaveCount(0);
	assert.equal(JSON.parse(await page.evaluate(() => globalThis.localStorage.getItem('formula-options'))).latexEnabled, false);
	assert.deepEqual(errors, []); assert.deepEqual(external, []);
	await page.close();
	for (const complex of [false, true]) {
		const fallback = await browser.newPage();
		let loads = 0;
		await fallback.addInitScript(() => globalThis.localStorage.setItem('formula-options', '{"latexEnabled":true}'));
		await fallback.route(`**/${core.fileName}`, route => { loads++; return route.abort(); });
		await fallback.goto(`${origin}/${html.fileName}${complex ? '?complex=1' : ''}`);
		await expect(fallback.locator(complex ? '#normal code' : '#normal pre')).toBeVisible();
		assert.equal(await fallback.locator('.katex').count(), 0);
		if (complex) assert.equal(loads, 0, 'Over-complex input must not start the lazy import');
		else assert.ok(loads > 0, 'Exercise the failed chunk fallback');
		await fallback.close();
	}
	console.log(`Chromium ${browser.version()}: real main/embed adapters, inline/block, default off, admin request/save/reload, untrusted commands, lazy failure and complexity gate passed.`);
} finally {
	await browser?.close();
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
}
