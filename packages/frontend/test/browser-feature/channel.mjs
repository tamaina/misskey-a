/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
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
const output = await mkdtemp(resolve(tmpdir(), 'misskey-channel-browser-'));
let server;
let browser;
try {
	const result = await build({
		root, configFile: false, logLevel: 'warn', plugins: [pluginFeatureDependencies(root, resolve(root, '../features')), pluginVvi(), vue()], define: { _DEV_: 'false' },
		resolve: { dedupe: ['vue', 'vite-vue-internationalization'], alias: [
			...['@features/auth/frontend/i.js', '@features/api/frontend/utility/misskey-api.js', '@features/ui/frontend/os.js', '@features/navigation/frontend/page.js', '@features/navigation/frontend/router.js', '@features/preferences/frontend/preferences.js', '@features/preferences/frontend/theme.js', '@features/preferences/frontend/local-storage.js', '@features/instance/frontend/instance.js', '@features/boot/frontend/shared/config.js', '@features/discovery/frontend/utility/autocomplete.js'].map(find => ({ find, replacement: resolve(fixture, 'channel-adapters.js') })),
			{ find: '@features/navigation/frontend/components/global/MkA.vue', replacement: resolve(fixture, 'ChannelLink.vue') },
			...['MkPullToRefresh.vue', 'MkPaginationControl.vue'].map(name => ({ find: `@features/ui/frontend/components/${name}`, replacement: resolve(fixture, 'ChannelInactive.vue') })),
			{ find: '@features', replacement: resolve(root, '../features') },
		] },
		build: { outDir: output, emptyOutDir: true, target: 'esnext', rolldownOptions: { input: resolve(fixture, 'channel.html') } },
	});
	const html = (Array.isArray(result) ? result : [result]).flatMap(item => item.output).find(item => item.fileName.endsWith('.html'));
	assert.ok(html);
	server = await preview({ root, configFile: false, build: { outDir: output }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
	const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
	browser = await chromium.launch({ headless: true, ...(process.env.MISSKEY_TEST_CHROMIUM ? { executablePath: process.env.MISSKEY_TEST_CHROMIUM } : {}) });
	console.log(`Channel browser fixture: Chromium ${browser.version()}`);
	const failures = [];
	let passed = 0;

	async function capture(page, name) {
		if (!process.env.MISSKEY_CHANNEL_SCREENSHOTS) return;
		await mkdir(process.env.MISSKEY_CHANNEL_SCREENSHOTS, { recursive: true });
		await page.screenshot({ path: resolve(process.env.MISSKEY_CHANNEL_SCREENSHOTS, `${name}.png`), fullPage: true });
	}

	async function check(name, action) {
		const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
		const page = await context.newPage();
		page.setDefaultTimeout(10_000);
		const errors = [];
		const external = [];
		page.on('pageerror', error => errors.push(error.message));
		page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
		await context.route('**/*', route => {
			if (route.request().url().startsWith(origin + '/')) return route.continue();
			external.push(route.request().url()); return route.abort();
		});
		try {
			await page.goto(`${origin}/${html.fileName}`);
			await expect(page.locator('.eftoefju .name').first()).toContainText('local channel 1');
			await action(page);
			assert.deepEqual(errors, []); assert.deepEqual(external, []);
			console.log(`PASS ${++passed}: ${name}`);
		} catch (error) { failures.push(name); console.error(`FAIL: ${name}`, error.message, JSON.stringify({ errors, calls: await page.evaluate(() => globalThis.window.channelFixture.calls) })); await capture(page, `failure-${failures.length}`); } finally { await context.close(); }
	}

	const button = (page, name) => page.getByRole('button', { name, exact: true });
	const cards = page => page.locator('.eftoefju .name');
	const calls = page => page.evaluate(() => globalThis.window.channelFixture.calls);
	await check('local default and remote trend filtering use real tabs/cards/paginator', async page => {
		await expect(button(page, 'Local')).toBeDisabled();
		assert.equal((await calls(page))[0].params.origin, 'local');
		await button(page, 'Remote').click();
		await expect(cards(page).first()).toContainText('remote channel 1');
		await expect(button(page, 'Remote')).toBeDisabled();
		assert.equal((await calls(page)).at(-1).params.origin, 'remote');
		await capture(page, 'channel-desktop');
	});
	await check('late detached origin response cannot replace visible cards', async page => {
		await page.evaluate(() => { globalThis.window.channelFixture.hold = 'channels/featured:remote'; });
		await button(page, 'Remote').click();
		await page.waitForFunction(() => globalThis.window.channelFixture.pending.length === 1);
		await button(page, 'Local').click();
		await expect(cards(page).first()).toContainText('local channel 1');
		await page.evaluate(() => globalThis.window.channelFixture.pending.shift()());
		await expect(cards(page)).toHaveCount(2);
		await expect(cards(page).first()).toContainText('local channel 1');
	});
	await check('search resets origin cursors and ignores an old in-flight page', async page => {
		await page.getByRole('navigation').getByRole('button', { name: 'Search', exact: true }).click();
		await page.getByRole('searchbox').fill('needle');
		await page.getByRole('searchbox').press('Enter');
		await expect(cards(page)).toHaveCount(10);
		await page.evaluate(() => { globalThis.window.channelFixture.hold = 'older'; });
		await button(page, 'Load more').click();
		await page.waitForFunction(() => globalThis.window.channelFixture.pending.length === 1);
		await button(page, 'Remote').click();
		await expect(cards(page).first()).toContainText('remote needle 1');
		const request = (await calls(page)).at(-1);
		assert.equal(request.params.origin, 'remote'); assert.equal(request.params.query, 'needle'); assert.equal(request.params.untilId, undefined);
		await page.evaluate(() => { globalThis.window.channelFixture.hold = null; globalThis.window.channelFixture.pending.shift()(); });
		await expect(cards(page)).toHaveCount(10);
		await expect(cards(page).first()).toContainText('remote needle 1');
		await button(page, 'Load more').click();
		await expect(cards(page)).toHaveCount(12);
		assert.equal((await calls(page)).at(-1).params.origin, 'remote');
		assert.ok((await calls(page)).at(-1).params.untilId.startsWith('r'));
		await page.locator('.fixture-page').evaluate(element => element.scrollTo(0, 0));
		await capture(page, 'channel-search');
	});
	await check('personal lists retain their endpoint without a local/remote filter', async page => {
		for (const [label, endpoint] of [['Favorites', 'channels/my-favorites'], ['Followed', 'channels/followed'], ['Owned', 'channels/owned']]) {
			await page.getByRole('navigation').getByRole('button', { name: label, exact: true }).click();
			await expect(cards(page).first()).toContainText('personal channel 1');
			await expect(button(page, 'Local')).toHaveCount(0); await expect(button(page, 'Remote')).toHaveCount(0);
			const request = (await calls(page)).at(-1);
			assert.equal(request.endpoint, endpoint); assert.equal(request.params.origin, undefined);
		}
	});
	await check('trend cards fit narrow mobile viewports without horizontal clipping', async page => {
		for (const width of [360, 390]) {
			await page.setViewportSize({ width, height: 844 });
			await capture(page, `channel-mobile-${width}`);
			const size = await page.evaluate(() => ({ viewport: globalThis.innerWidth, content: globalThis.document.documentElement.scrollWidth, cards: [...globalThis.document.querySelectorAll('.eftoefju')].map(card => ({ left: card.getBoundingClientRect().left, right: card.getBoundingClientRect().right })) }));
			assert.ok(size.content <= size.viewport && size.cards.every(card => card.left >= 0 && card.right <= size.viewport), JSON.stringify(size));
		}
	});
	assert.deepEqual(failures, []);
	console.log(`All ${passed} channel browser scenarios passed.`);
} finally {
	await browser?.close();
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
}
