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
const output = await mkdtemp(resolve(tmpdir(), 'misskey-media-browser-'));
let server;
let browser;
try {
	const result = await build({
		root, configFile: false, logLevel: 'warn', plugins: [pluginFeatureDependencies(root, resolve(root, '../features')), pluginVvi(), vue()], define: { _DEV_: 'false' },
		resolve: { dedupe: ['vue', 'vite-vue-internationalization'], alias: [
			...['@features/auth/frontend/i.js', '@features/ui/frontend/os.js', '@features/preferences/frontend/preferences.js', '@features/preferences/frontend/theme.js', '@features/preferences/frontend/local-storage.js', '@features/instance/frontend/instance.js', '@features/boot/frontend/shared/config.js', '@features/drive/frontend/utility/get-file-menu.js', '@features/drive/frontend/utility/media-proxy.js'].map(find => ({ find, replacement: resolve(fixture, 'media-adapters.js') })),
			{ find: '@features/navigation/frontend/components/global/MkA.vue', replacement: resolve(fixture, 'MediaLink.vue') },
			{ find: '@features', replacement: resolve(root, '../features') },
		] },
		worker: { format: 'es', plugins: () => [pluginFeatureDependencies(root, resolve(root, '../features'))] },
		build: { outDir: output, emptyOutDir: true, target: 'esnext', rolldownOptions: { input: resolve(fixture, 'media.html') } },
	});
	const html = (Array.isArray(result) ? result : [result]).flatMap(item => item.output).find(item => item.fileName.endsWith('.html'));
	assert.ok(html);
	server = await preview({ root, configFile: false, build: { outDir: output }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
	const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
	browser = await chromium.launch({ headless: true, ...(process.env.MISSKEY_TEST_CHROMIUM ? { executablePath: process.env.MISSKEY_TEST_CHROMIUM } : {}) });
	console.log(`Media browser fixture: Chromium ${browser.version()}`);
	const failures = [];
	let passed = 0;

	async function capture(page, name) {
		if (!process.env.MISSKEY_MEDIA_SCREENSHOTS) return;
		await mkdir(process.env.MISSKEY_MEDIA_SCREENSHOTS, { recursive: true });
		await page.screenshot({ path: resolve(process.env.MISSKEY_MEDIA_SCREENSHOTS, `${name}.png`), fullPage: true });
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
			await page.addInitScript(() => {
				Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 });
				const workerCounts = globalThis.blurhashWorkerCounts = new Map();
				const postMessage = Worker.prototype.postMessage;
				Worker.prototype.postMessage = function (message, ...options) {
					if (typeof message?.hash === 'string') workerCounts.set(message.hash, (workerCounts.get(message.hash) ?? 0) + 1);
					return postMessage.call(this, message, ...options);
				};
				const drawImage = CanvasRenderingContext2D.prototype.drawImage;
				CanvasRenderingContext2D.prototype.drawImage = function (...args) {
					drawImage.apply(this, args);
					if (this.canvas.parentElement?.id === 'resize-probe') {
						this.canvas.dataset.fullDraws = String(Number(this.canvas.dataset.fullDraws ?? 0) + 1);
					}
				};
			});
			await page.goto(`${origin}/${html.fileName}`);
			await expect(page.getByRole('button', { name: /Show content/ })).toBeVisible();
			await action(page);
			assert.deepEqual(errors, []); assert.deepEqual(external, []);
			console.log(`PASS ${++passed}: ${name}`);
		} catch (error) { failures.push(name); console.error(`FAIL: ${name}`, error.message, JSON.stringify({ errors, external })); await capture(page, `failure-${failures.length}`); } finally { await context.close(); }
	}

	const canvases = page => page.locator('#cw-content canvas');

	async function opaque(locator) {
		await expect.poll(() => locator.evaluate(canvas => canvas.getContext('2d').getImageData(0, 0, 1, 1).data[3])).toBe(255);
	}

	await check('CW opening and repeated closing keep sized media and individual visibility', async page => {
		await page.getByRole('button', { name: /Show content/ }).click();
		const images = page.locator('#cw-content img[data-marker]');
		await expect(images).toHaveCount(3);
		for (const img of await images.all()) {
			await expect.poll(() => img.evaluate(element => Number(element.getAttribute('width')) === element.parentElement.clientWidth && element.parentElement.clientWidth > 0)).toBe(true);
		}
		await opaque(canvases(page).nth(1));
		await page.locator('#cw-content button:has(.ti-eye-off)').first().click();
		await page.getByRole('button', { name: 'Hide', exact: true }).click();
		await page.getByRole('button', { name: /Show content/ }).click();
		await expect(canvases(page).nth(0)).toBeVisible();
		await expect(canvases(page).nth(1)).toBeVisible();
		await expect(images.nth(2)).toBeVisible();
		await opaque(canvases(page).nth(0));
		await capture(page, 'media-cw-open');
		await images.nth(2).click();
		await expect(page.locator('#popup [data-gallery-click-action="hidden"]')).toHaveCount(2);
		await page.locator('#popup button:has(.ti-arrow-left)').click();
		await capture(page, 'media-sensitive-lightbox');
		await page.locator('#popup [data-gallery-click-action="hidden"]').nth(1).click();
		await expect(page.locator('#popup [data-gallery-click-action="hidden"]')).toHaveCount(1);
		await page.locator('#popup button:has(.ti-arrow-left)').click();
		await capture(page, 'media-manual-lightbox');
		await page.locator('#popup button:has(.ti-arrow-right)').click();
		await expect(page.locator('#popup [data-gallery-click-action="hidden"]')).toHaveCount(1);
		await page.evaluate(() => globalThis.window.mediaFixture.close());
		await page.setViewportSize({ width: 360, height: 800 });
		await expect.poll(() => images.nth(0).evaluate(element => Number(element.getAttribute('width')) === element.parentElement.clientWidth)).toBe(true);
		await capture(page, 'media-mobile');
		const widths = await page.evaluate(() => ({ width: globalThis.innerWidth, scroll: globalThis.document.documentElement.scrollWidth }));
		assert.ok(widths.scroll <= widths.width);
	});
	await check('one initial full Blurhash decode and repaint of full/average pixels after resize', async page => {
		for (const id of ['resize-probe', 'average-probe']) await opaque(page.locator(`#${id} canvas`));
		const full = page.locator('#resize-probe canvas');
		const completedDraws = () => full.evaluate(canvas => Number(canvas.dataset.fullDraws ?? 0));
		const workerRequests = () => page.evaluate(() => globalThis.blurhashWorkerCounts.get(globalThis.window.mediaFixture.resizeHash) ?? 0);
		await expect.poll(completedDraws).toBeGreaterThan(0);
		const initialRequests = await workerRequests();
		// If the browser falls back to main-thread decoding, count completed draws.
		assert.equal(initialRequests || await completedDraws(), 1, 'mount must not start a second full Blurhash decode');
		await page.evaluate(() => globalThis.window.mediaFixture.resize(200));
		for (const id of ['resize-probe', 'average-probe']) {
			await expect(page.locator(`#${id} canvas`)).toHaveAttribute('width', '128');
			await opaque(page.locator(`#${id} canvas`));
		}
		await expect.poll(completedDraws).toBe(2);
		assert.equal(await workerRequests(), initialRequests === 0 ? 0 : 2);
		await capture(page, 'media-blurhash-resized');
	});
	assert.deepEqual(failures, []);
	console.log(`All ${passed} media browser scenarios passed.`);
} finally {
	await browser?.close();
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
}
