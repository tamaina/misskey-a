/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';

const origin = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Capture requires a loopback Storybook');
const output = resolve(process.argv[2] ?? '../../.codex-local/billing-review-screenshots');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
const states = [
	['residencesettings--unset', 'residence-unset', '居住地未登録', '居住地を登録する', true],
	['residencesettings--registered', 'residence-registered', '登録済みの居住国 JP', '居住地を登録する', false],
	['residencesettings--required-subdivision-missing', 'residence-subdivision-missing', 'US 選択済み・必須の州未選択', '居住地を登録する', true],
	['walletsettings--residence-required', 'wallet-residence-required', '居住地未登録のウォレット登録制限', 'Synthetic wallet (disabled) で登録', true],
	['servicesubscriptions--residence-required', 'purchase-residence-required', '居住地未登録の購入開始制限', '注文を作成', true],
	['peerpayments--residence-required', 'peer-residence-required', '居住地未登録の送金開始制限', '送金内容を準備する', true],
];
states.push(['peerpayments--recipient-without-wallet', 'peer-recipient-without-wallet', '受取人選択後・公開ウォレットなし', '送金内容を準備する', true]);
const captures = [];
try {
	for (const [viewport, size] of Object.entries({ desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } })) {
		for (const [story, name, caption, buttonName, disabled] of states) {
			const context = await browser.newContext({ viewport: size, reducedMotion: 'reduce' });
			const errors = [];
			const externalRequests = [];
			await context.route('**/*', route => {
				const url = new URL(route.request().url());
				if (url.origin === new URL(origin).origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
				externalRequests.push(url.origin);
				return route.abort();
			});
			const page = await context.newPage();
			page.on('pageerror', error => errors.push(String(error)));
			await page.goto(`${origin}/iframe.html?id=features-billing-frontend-${story}&viewMode=story`, { timeout: 60000 });
			const button = page.getByRole('button').filter({ hasText: buttonName });
			await button.waitFor({ timeout: 60000 }).catch(async error => {
				await writeFile(resolve(output, `${name}-${viewport}-failure.json`), JSON.stringify({ errors, externalRequests, url: page.url(), text: await page.locator('body').innerText() }, null, 2));
				throw error;
			});
			if (story.includes('registered')) await expect(page.getByText('JP / 日本', { exact: true })).toBeVisible();
			if (story.includes('subdivision')) await expect(page.getByText('US / アメリカ合衆国', { exact: true })).toBeVisible();
			if (story.includes('subdivision')) await expect(page.getByText('州・地域（ISO行政区分コード）', { exact: true })).toBeVisible();
			if (story.startsWith('wallet')) await expect(page.getByText('Synthetic chain (123456)', { exact: true })).toBeVisible();
			if (story.startsWith('service') || story.startsWith('peer')) {
				const load = page.getByRole('button', { name: story.startsWith('peer') ? 'ウォレット・トークン・履歴を再読み込み' : '読み込む', exact: true });
				await expect(load).toBeEnabled();
			}
			if (story.includes('recipient-without-wallet')) await expect(page.getByText('この受取人には公開された受取ウォレットがありません。', { exact: true })).toBeVisible({ timeout: 60000 }).catch(async error => {
				await writeFile(resolve(output, `${name}-${viewport}-failure.json`), JSON.stringify({ errors, externalRequests, text: await page.locator('body').innerText() }, null, 2));
				throw error;
			});
			if (disabled) await expect(button).toBeDisabled(); else await expect(button).toBeEnabled();
			await page.evaluate(() => document.fonts.ready);
			await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' });
			assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `${name}/${viewport}: horizontal overflow`);
			assert.deepEqual(errors, [], `${name}/${viewport}: browser errors`);
			const file = resolve(output, `${name}-${viewport}.png`);
			await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
			captures.push({ file, caption, viewport, size, story, externalRequests: [...new Set(externalRequests)] });
			console.log(`PASS ${name}/${viewport}`);
			await context.close();
		}
	}
	await writeFile(resolve(output, 'captions.json'), JSON.stringify(captures, null, 2) + '\n');
} finally {
	await browser.close();
}
