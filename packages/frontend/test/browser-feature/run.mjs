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
				...['@/custom-emojis.js', '@/i.js', '@/os.js', '@/utility/misskey-api.js', '@/utility/copy-to-clipboard.js'].map(find => ({ find, replacement: resolve(fixture, 'emoji-adapters.js') })),
				{ find: '@/components/MkInput.vue', replacement: resolve(fixture, 'EmojiInput.vue') },
				{ find: '@/components/MkFoldableSection.vue', replacement: resolve(fixture, 'EmojiSection.vue') },
				{ find: '@/components/MkCustomEmojiDetailedDialog.vue', replacement: resolve(fixture, 'EmojiDialog.vue') },
				{ find: '@/pages/emoji-edit-dialog.vue', replacement: resolve(fixture, 'EmojiDialog.vue') },
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
		browser = await chromium.launch({ headless: true, ...(process.env.MISSKEY_TEST_CHROMIUM ? { executablePath: process.env.MISSKEY_TEST_CHROMIUM } : {}) });
		console.log(`Chromium fixture version: ${browser.version()}`);
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
					assert.equal(await page.locator('#requests').innerText(), '[]', 'Catalog mount must not fetch detail');
					const query = page.locator('#emoji-catalog input');
					assert.equal(await query.getAttribute('placeholder'), locales[locale].search);
					await query.fill('canine');
					const search = page.locator('#emoji-catalog [data-foldable]').first();
					await page.waitForFunction(() => globalThis.document.querySelectorAll('#emoji-catalog [data-foldable]').length === 3);
					assert.equal(await search.locator('h3').innerText(), locales[locale].searchResult);
					assert.equal(await search.locator('button').count(), 1);
					assert.ok((await search.innerText()).includes('feature_fox'));
					await query.fill(':feature_cat:');
					await page.waitForFunction(() => globalThis.document.querySelector('#emoji-catalog [data-foldable]')?.textContent.includes('feature_cat'));
					assert.equal(await search.locator('button').count(), 1);
					await search.locator('button').click();
					assert.deepEqual(await page.locator('#menu button').allTextContents(), [locales[locale].copy, locales[locale].info]);
					await page.locator('#menu button').nth(0).click();
					assert.equal(await page.locator('#copied').innerText(), ':feature_cat:');
					await page.locator('#menu button').nth(1).click();
					await page.locator('#dialog-close').waitFor();
					assert.equal(await page.locator('#requests').innerText(), JSON.stringify([{ route: 'emoji', name: 'feature_cat' }]));
					await page.locator('#dialog-close').click();
					assert.equal(await page.locator('#disposals').innerText(), '1');
					assert.equal(await page.locator('#dialog').innerText(), '');
					await query.fill('');
					await page.waitForFunction(() => globalThis.document.querySelectorAll('#emoji-catalog [data-foldable]').length === 2);
					assert.equal(await page.locator('#action-error').innerText(), '');
				}
				assert.deepEqual(errors, []);
			} finally { await page.close(); }
		}
		for (const role of ['moderator', 'manager', 'admin', 'member']) {
			const page = await browser.newPage();
			try {
				await page.goto(`${origin}/${html.fileName}?locale=en-US&role=${role}`);
				await page.waitForFunction(() => globalThis.document.querySelector('#status')?.textContent === 'ready');
				assert.equal(await page.getByRole('button', { name: locales['en-US'].manageCustomEmojis, exact: true }).count(), role === 'member' ? 0 : 1);
				await page.locator('#emoji-catalog [data-foldable] button').first().click();
				const expected = [locales['en-US'].copy, locales['en-US'].info];
				// Preserve the existing ?? predicate rather than changing permissions during migration.
				if (role === 'moderator') expected.push(locales['en-US'].edit);
				assert.deepEqual(await page.locator('#menu button').allTextContents(), expected);
				if (role === 'moderator') {
					await page.locator('#menu button').nth(2).click();
					await page.locator('#dialog-close').waitFor();
					assert.equal(await page.locator('#dialog').getAttribute('data-kind'), 'edit');
					await page.locator('#dialog-close').click();
					assert.equal(await page.locator('#disposals').innerText(), '1');
				}
				assert.equal(await page.locator('#action-error').innerText(), '');
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
		console.log('Chromium feature smoke passed: four locales, reload, retry, login prompt, emoji search/menu permissions/dialog cleanup and failed locale loading.');
	}
} finally {
	await browser?.close();
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
}
