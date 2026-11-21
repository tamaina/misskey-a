/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import { chromium, expect } from '@playwright/test';
import { pluginVvi } from '../../lib/vite-plugin-vvi.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixture = await mkdtemp(resolve(root, 'test/browser-feature/error-log-fixture-'));
const output = await mkdtemp(resolve(tmpdir(), 'misskey-a-error-log-browser-'));
let server;
let browser;
try {
	await writeFile(resolve(fixture, 'index.html'), '<!doctype html><html><body><div id="app"></div><script type="module" src="./entry.js"></script></body></html>');
	await writeFile(resolve(fixture, 'controls.js'), `
		import { defineComponent, h, ref } from 'vue';
		export const Button = defineComponent({ props: ['disabled'], emits: ['click'], setup: (props, { emit, slots }) => () => h('button', { disabled: props.disabled, onClick: () => emit('click') }, slots.default?.()) });
		export const Folder = defineComponent({ setup: (_, { slots }) => { const open = ref(false); return () => h('section', [h('button', { onClick: () => { open.value = !open.value; } }, slots.label?.()), open.value ? h('div', { 'data-details': '' }, slots.default?.()) : null]); } });
		export const toast = text => globalThis.window.fixtureToasts.push(text);
		export const alert = async () => { globalThis.window.fixtureAlerts++; };
		export const confirm = async () => ({ canceled: globalThis.window.fixtureCancelDelete });
	`);
	await writeFile(resolve(fixture, 'button.js'), "export { Button as default } from './controls.js';");
	await writeFile(resolve(fixture, 'folder.js'), "export { Folder as default } from './controls.js';");
	await writeFile(resolve(fixture, 'entry.js'), `
		import { createApp, h } from 'vue';
		import { createInternationalization } from 'virtual:vite-vue-internationalization';
		import ErrorLog from '@features/preferences/frontend/pages/settings/error-log.vue';
		import * as logs from '@features/runtime/frontend/error-log.js';
		globalThis.window.fixtureToasts = []; globalThis.window.fixtureAlerts = 0; globalThis.window.fixtureCancelDelete = false;
		logs.initClientErrorLog();
		const app = createApp(ErrorLog);
		app.component('MkTime', { render: () => h('time') });
		const locale = createInternationalization({ initialLocale: 'en-US' });
		await locale.ready; await locale.loadLocale('en-US');
		app.use(locale); app.mount('#app');
		globalThis.window.fixtureLogs = logs;
	`);
	const result = await build({
		root, configFile: false, logLevel: 'warn', plugins: [pluginVvi(), vue()],
		define: { _VERSION_: JSON.stringify('synthetic-fixture'), _LANGS_: '[]' },
		resolve: { dedupe: ['vue', 'vite-vue-internationalization'], alias: [
			{ find: '@features/ui/frontend/components/MkButton.vue', replacement: resolve(fixture, 'button.js') },
			{ find: '@features/ui/frontend/components/MkFolder.vue', replacement: resolve(fixture, 'folder.js') },
			{ find: '@features/ui/frontend/os.js', replacement: resolve(fixture, 'controls.js') },
			{ find: '@features', replacement: resolve(root, '../features') },
		] },
		build: { outDir: output, emptyOutDir: true, target: 'esnext', rolldownOptions: { input: resolve(fixture, 'index.html') } },
	});
	const artifacts = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
	const html = artifacts.find(item => item.fileName.endsWith('.html'));
	assert.ok(html, 'Fixture HTML must exist');
	server = await preview({ root, configFile: false, build: { outDir: output }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
	const address = server.httpServer.address();
	assert.ok(address && typeof address === 'object');
	browser = await chromium.launch({ headless: true, ...(process.env.MISSKEY_TEST_CHROMIUM ? { executablePath: process.env.MISSKEY_TEST_CHROMIUM } : {}) });
	const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
	const page = await context.newPage();
	const errors = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto(`http://127.0.0.1:${address.port}/${html.fileName}`);
	await page.waitForFunction(() => globalThis.window.fixtureLogs);
	await expect(page.getByRole('button', { name: 'Copy all', exact: true })).toBeDisabled();
	await page.evaluate(() => globalThis.window.dispatchEvent(new globalThis.ErrorEvent('error', { error: new Error('synthetic browser error\ncookie=sid=synthetic-session; csrf=synthetic-csrf') })));
	await expect(page.locator('article')).toHaveCount(1);
	const id = await page.evaluate(() => globalThis.window.fixtureLogs.clientErrorLogs.value[0].id);
	await page.reload();
	await page.waitForFunction(() => globalThis.window.fixtureLogs);
	assert.equal(await page.evaluate(() => globalThis.window.fixtureLogs.clientErrorLogs.value[0].id), id);
	await page.getByRole('button', { name: 'Details', exact: true }).click();
	await expect(page.locator('[data-details]')).toContainText('synthetic browser error');
	await page.getByRole('button', { name: 'Copy all', exact: true }).click();
	await page.waitForFunction(() => globalThis.window.fixtureToasts.length === 1);
	const copied = await page.evaluate(() => globalThis.navigator.clipboard.readText());
	assert.ok(copied.includes('synthetic browser error') && copied.includes('[REDACTED]'));
	assert.ok(!copied.includes('synthetic-session') && !copied.includes('synthetic-csrf'));
	await page.evaluate(() => { globalThis.window.fixtureCancelDelete = true; });
	await page.getByRole('button', { name: 'Delete all', exact: true }).click();
	await expect(page.locator('article')).toHaveCount(1);
	await page.evaluate(() => {
		globalThis.window.fixtureCancelDelete = false;
		globalThis.window.fixtureRemove = globalThis.Storage.prototype.removeItem;
		globalThis.Storage.prototype.removeItem = () => { throw new Error('synthetic blocked storage'); };
	});
	await page.getByRole('button', { name: 'Delete all', exact: true }).click();
	await page.waitForFunction(() => globalThis.window.fixtureAlerts === 1);
	await expect(page.locator('article')).toHaveCount(1);
	await page.evaluate(() => { globalThis.Storage.prototype.removeItem = globalThis.window.fixtureRemove; });
	await page.getByRole('button', { name: 'Delete all', exact: true }).click();
	await expect(page.locator('article')).toHaveCount(0);
	assert.equal(await page.evaluate(() => globalThis.localStorage.getItem('clientErrorLogs')), null);
	assert.deepEqual(errors, []);
	console.log(`Chromium ${browser.version()}: client error log capture, reload/ID, details, native clipboard redaction, cancel, blocked deletion and clear passed.`);
	await context.close();
} finally {
	await browser?.close();
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
	await rm(fixture, { recursive: true, force: true });
}
