/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import { chromium, expect } from '@playwright/test';
import { pluginVvi } from '../../lib/vite-plugin-vvi.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixture = resolve(root, 'test/browser-feature/fixture');
const output = await mkdtemp(resolve(tmpdir(), 'misskey-mail-browser-'));
let server;
let browser;
try {
	const result = await build({
		root, configFile: false, logLevel: 'warn', plugins: [pluginVvi(), vue()],
		resolve: { dedupe: ['vue', 'vite-vue-internationalization'], alias: [
			...['@features/auth/frontend/i.js', '@features/api/frontend/utility/misskey-api.js', '@features/ui/frontend/os.js', '@features/navigation/frontend/page.js', '@features/navigation/frontend/router.js'].map(find => ({ find, replacement: resolve(fixture, 'mail-adapters.js') })),
			{ find: '@features', replacement: resolve(root, '../features') },
		] },
		build: { outDir: output, emptyOutDir: true, target: 'esnext', rolldownOptions: { input: resolve(fixture, 'mail.html') } },
	});
	const html = (Array.isArray(result) ? result : [result]).flatMap(item => item.output).find(item => item.fileName.endsWith('.html'));
	assert.ok(html);
	server = await preview({ root, configFile: false, build: { outDir: output }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
	const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
	browser = await chromium.launch({ headless: true, ...(process.env.MISSKEY_TEST_CHROMIUM ? { executablePath: process.env.MISSKEY_TEST_CHROMIUM } : {}) });
	console.log(`Mail browser fixture: Chromium ${browser.version()}`);
	let passed = 0;
	const failures = [];

	async function check(name, action, query = '') {
		const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
		const page = await context.newPage();
		page.setDefaultTimeout(10_000);
		const errors = [];
		const external = [];
		page.on('pageerror', error => errors.push(error.message));
		await context.route('**/*', route => {
			if (route.request().url().startsWith(origin + '/')) return route.continue();
			external.push(route.request().url());
			return route.abort();
		});
		try {
			await page.goto(`${origin}/${html.fileName}${query}`);
			await expect(page.getByRole('heading', { name: 'メール', exact: true })).toBeVisible();
			await expect(page.locator('section[aria-busy]')).toHaveAttribute('aria-busy', 'false');
			await action(page);
			assert.deepEqual(errors, []);
			assert.deepEqual(external, [], 'No external resource request or delivery is allowed');
			console.log(`PASS ${++passed}: ${name}`);
		} catch (error) {
			failures.push(name); console.error(`FAIL: ${name}`, error.message);
		} finally { await context.close(); }
	}

	const button = (page, name) => page.getByRole('button', { name, exact: true });
	const calls = (page, endpoint) => page.evaluate(endpoint => globalThis.window.mailFixture.calls.filter(call => call.endpoint === endpoint), endpoint);
	const idle = page => expect(page.locator('section[aria-busy]')).toHaveAttribute('aria-busy', 'false');

	async function compose(page) {
		await button(page, '作成').click(); await idle(page);
		await page.getByLabel('宛先（カンマ区切り）', { exact: true }).fill('one@example.invalid; two@example.invalid');
		await page.getByLabel('件名', { exact: true }).fill('Synthetic subject');
		await page.getByLabel('本文', { exact: true }).fill('Synthetic body');
	}

	await check('signed-out view performs no API calls', async page => {
		await expect(page.getByText('メールを利用するにはログインしてください。')).toBeVisible();
		assert.deepEqual(await page.evaluate(() => globalThis.window.mailFixture.calls), []);
	}, '?signedOut');
	await check('unavailable mailbox does not fetch messages', async page => {
		await expect(page.getByText('このサーバーではメール機能が設定されていません。')).toBeVisible();
		assert.equal((await calls(page, 'email/list')).length, 0);
	}, '?unavailable');
	await check('disabled mailbox blocks send', async page => {
		await compose(page); await expect(button(page, '送信')).toBeDisabled();
		assert.equal((await calls(page, 'email/send')).length, 0);
	}, '?disabled');
	await check('pagination, reading, attachment downloads and confirmed deletion', async page => {
		await button(page, 'もっと見る').click(); await idle(page);
		assert.equal((await calls(page, 'email/list')).at(-1).params.untilId, '71');
		await expect(button(page, 'もっと見る')).toHaveCount(0);
		await page.getByRole('button', { name: /^Synthetic mail 1 / }).click(); await idle(page);
		await expect(button(page, '未読にする')).toBeVisible();
		await button(page, '未読にする').click(); await idle(page);
		await expect(button(page, '既読にする')).toBeVisible();
		for (const [name, filename] of [['元のメールをダウンロード', 'message.eml'], ['attachment.txt (7 B)', '_attachment.txt']]) {
			const downloadEvent = page.waitForEvent('download'); await button(page, name).click();
			const download = await downloadEvent;
			assert.equal(download.suggestedFilename(), filename);
			assert.equal(await readFile(await download.path(), 'utf8'), 'fixture');
			await idle(page);
		}
		await page.evaluate(() => { globalThis.window.mailFixture.cancel = true; });
		await button(page, '削除').click(); assert.equal((await calls(page, 'email/delete')).length, 0);
		await page.evaluate(() => { globalThis.window.mailFixture.cancel = false; });
		await button(page, '削除').click(); await idle(page);
		assert.equal((await calls(page, 'email/delete')).length, 1);
		await expect(page.getByRole('button', { name: /^Synthetic mail 1 / })).toHaveCount(0);
	});
	await check('untrusted HTML stays scriptless and cannot request remote images', async page => {
		await page.getByRole('button', { name: /^Synthetic mail 1 / }).click(); await idle(page);
		await expect(page.locator('pre')).toHaveText('Plain <script>text only</script>');
		await page.getByLabel('HTML表示', { exact: true }).check();
		await expect(page.locator('iframe')).toHaveAttribute('sandbox', '');
		await expect(page.frameLocator('iframe').getByText('Isolated body')).toBeVisible();
		assert.equal(await page.evaluate(() => globalThis.window.mailScriptRan), undefined);
	});
	await check('compose preview, cancellation, uncertain retry and sent state', async page => {
		await compose(page);
		await page.getByRole('combobox', { name: /^形式/ }).selectOption('mfm');
		await button(page, 'プレビュー').click(); await idle(page);
		await expect(page.frameLocator('iframe').getByText('Synthetic preview')).toHaveCSS('color', 'rgb(255, 0, 0)');
		await page.getByLabel('本文', { exact: true }).fill('Updated body');
		await expect(page.locator('iframe')).toHaveCount(0);
		await page.evaluate(() => { globalThis.window.mailFixture.cancel = true; });
		await button(page, '送信').click(); assert.equal((await calls(page, 'email/send')).length, 0);
		await page.evaluate(() => { globalThis.window.mailFixture.cancel = false; globalThis.window.mailFixture.failNext = 'email/send'; });
		await button(page, '送信').click(); await idle(page);
		await expect(page.getByRole('alert')).toContainText('SYNTHETIC_FAILURE');
		await expect(page.getByLabel('本文', { exact: true })).toHaveValue('Updated body');
		await button(page, '送信').click(); await idle(page);
		const submissions = await calls(page, 'email/send');
		assert.equal(submissions.length, 2);
		assert.equal(submissions[0].params.idempotencyKey, submissions[1].params.idempotencyKey);
		assert.deepEqual(submissions[1].params.to, ['one@example.invalid', 'two@example.invalid']);
		await expect(page.getByText('Synthetic subject', { exact: true })).toBeVisible();
		await expect(page.getByText('送信待ち', { exact: true })).toBeVisible();
		await button(page, '作成').click(); await idle(page);
		await expect(page.getByLabel('本文', { exact: true })).toHaveValue('');
	});
	await check('forwarding link is cleaned without automatically confirming or persisting the code', async page => {
		assert.equal(new URL(page.url()).pathname, '/my/mail');
		assert.equal(new URL(page.url()).search, '');
		await expect(page.getByLabel('転送先へ届いた確認コード')).toHaveValue('synthetic-one-use-code');
		assert.equal((await calls(page, 'email/forwarding/confirm')).length, 0);
		assert.deepEqual(await page.evaluate(() => [globalThis.localStorage.length, globalThis.sessionStorage.length]), [0, 0]);
		await button(page, '転送先を確認').click(); await idle(page);
		assert.equal((await calls(page, 'email/forwarding/confirm'))[0].params.token, 'synthetic-one-use-code');
		await expect(page.getByLabel('転送先へ届いた確認コード')).toHaveValue('');
	}, '?verify=synthetic-one-use-code');
	await check('failed mailbox configuration leaves the checkbox matching confirmed server state', async page => {
		await button(page, '設定').click(); await idle(page);
		await page.evaluate(() => { globalThis.window.mailFixture.failNext = 'email/configure'; });
		await page.getByLabel('メールを有効にする', { exact: true }).click(); await idle(page);
		await expect(page.getByRole('alert')).toContainText('SYNTHETIC_FAILURE');
		await expect(page.getByLabel('メールを有効にする', { exact: true })).toBeChecked();
		await page.getByLabel('メールを有効にする', { exact: true }).click(); await idle(page);
		await expect(page.getByLabel('メールを有効にする', { exact: true })).not.toBeChecked();
		assert.deepEqual((await calls(page, 'email/configure')).map(call => call.params.enabled), [false, false]);
	});
	await check('reading keeps back navigation disabled until the selected message settles', async page => {
		await page.evaluate(() => { globalThis.window.mailFixture.hold = 'email/read'; });
		await page.getByRole('button', { name: /^Synthetic mail 1 / }).click();
		await expect(button(page, '一覧に戻る')).toBeDisabled();
		await page.evaluate(() => globalThis.window.mailFixture.release()); await idle(page);
		await button(page, '一覧に戻る').click();
		await expect(page.getByRole('alert')).toHaveCount(0);
	});
	await check('mobile compose fits viewport and desktop presentation remains usable', async page => {
		await compose(page);
		assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), true);
		if (process.env.MISSKEY_MAIL_SCREENSHOTS) {
			await mkdir(process.env.MISSKEY_MAIL_SCREENSHOTS, { recursive: true });
			await page.screenshot({ path: resolve(process.env.MISSKEY_MAIL_SCREENSHOTS, 'mail-mobile.png'), fullPage: true });
			await page.setViewportSize({ width: 1280, height: 900 });
			await page.screenshot({ path: resolve(process.env.MISSKEY_MAIL_SCREENSHOTS, 'mail-desktop.png'), fullPage: true });
		}
	});
	assert.deepEqual(failures, []);
	console.log(`All ${passed} mail browser scenarios passed; API/storage/SMTP are synthetic, no external delivery.`);
} finally {
	await browser?.close();
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
}
