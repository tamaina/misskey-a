/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import { chromium } from '@playwright/test';
import locales from 'i18n';
import { pluginVvi } from '../../lib/vite-plugin-vvi.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixture = resolve(root, 'test/browser-feature/fixture');
const output = await mkdtemp(resolve(tmpdir(), 'misskey-a-feature-browser-'));
let server;
let browser;
try {
	const result = await build({
		root, configFile: false, logLevel: 'warn', plugins: [pluginVvi(), vue()],
		resolve: {
			dedupe: ['vue', 'vite-vue-internationalization'],
			alias: [
				...['@/page.js', '@/utility/please-login.js', '@/instance.js', '@/preferences.js'].map(find => ({ find, replacement: resolve(fixture, 'adapters.js') })),
				{ find: '@/components/MkButton.vue', replacement: resolve(fixture, 'Button.vue') },
				{ find: '@features', replacement: resolve(root, '../features') },
				{ find: '@', replacement: resolve(root, 'src') },
			],
		},
		build: { outDir: output, emptyOutDir: true, target: 'esnext', rolldownOptions: { input: resolve(fixture, 'index.html') } },
	});
	const artifacts = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
	const html = artifacts.find(item => item.fileName.endsWith('.html'));
	const french = artifacts.find(item => item.type === 'chunk' && item.facadeModuleId?.endsWith('/locale/fr-FR'));
	assert.ok(html && french, 'Fixture HTML and locale chunk must exist');
	if (process.argv.includes('--build-only')) {
		console.log('Browser fixture production build passed; browser execution was not requested.');
	} else {
		server = await preview({ root, configFile: false, build: { outDir: output }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
		const address = server.httpServer.address();
		assert.ok(address && typeof address === 'object');
		const origin = `http://127.0.0.1:${address.port}`;
		browser = await chromium.launch({ headless: true });
		for (const locale of ['ja-JP', 'en-US', 'fr-FR', 'da-DK']) {
			const page = await browser.newPage();
			const errors = [];
			page.on('pageerror', error => errors.push(error.message));
			try {
				for (const reload of [false, true]) {
					if (reload) await page.reload();
					else await page.goto(`${origin}/${html.fileName}?locale=${locale}`);
					await page.waitForFunction(() => globalThis.document.querySelector('#status')?.textContent === 'ready');
					assert.equal(await page.locator('#not-found').innerText(), locales[locale].notFoundDescription);
					assert.equal(await page.title(), locales[locale].notFound);
					assert.equal(await page.locator('#empty').innerText(), locales[locale].nothing);
					assert.equal(await page.locator('#error button').innerText(), locales[locale].retry);
					assert.ok((await page.locator('#error').innerText()).includes(locales[locale].somethingHappened));
					assert.equal(await page.locator('html').getAttribute('data-login-path'), '/');
					await page.locator('#error button').click();
					assert.equal(await page.locator('#retry-count').innerText(), '1');
				}
				assert.deepEqual(errors, []);
			} finally { await page.close(); }
		}
		const page = await browser.newPage();
		try {
			let blocked = 0;
			await page.route(`**/${french.fileName}`, route => { blocked++; return route.abort(); });
			await page.goto(`${origin}/${html.fileName}?locale=fr-FR`);
			await page.waitForFunction(() => globalThis.document.querySelector('#status')?.textContent === 'error');
			assert.ok(blocked > 0, 'The locale chunk request must have been blocked');
			assert.equal(await page.locator('#app').innerHTML(), '', 'Failed locale load must not mount the view');
		} finally { await page.close(); }
		console.log('Chromium feature smoke passed: four locales, reload, retry, login prompt and failed locale loading.');
	}
} finally {
	await browser?.close();
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
}
