/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from './fixtures.js';
import {
	// const
	BASE_URL,
	// utils
	resetState, registerUser,
	// page utils
	signIn, closeUserSetupDialog, closeUserSetupDialogIfVisible,
} from './utils.js';

test.describe('Router transition', () => {
	test.beforeAll(async () => {
		await resetState();
		await registerUser('admin', 'pass', true);
		await registerUser('alice', 'alice1234');
	});

	test.beforeEach(async ({ page }) => {
		await signIn(page, 'alice', 'alice1234');

		// 表示に時間がかかるのでデフォルト秒数だとタイムアウトする。少し待つ
		await page.waitForTimeout(1000);

		await closeUserSetupDialogIfVisible(page);
	});

	test('Fukushu can open over Home on launch and be dismissed or disabled', async ({ page }) => {
		// Account setup can appear after the new document has mounted.
		const setupClose = page.getByTestId('user-setup-dialog').getByTestId('modal-window-close');
		await page.addLocatorHandler(setupClose, () => closeUserSetupDialog(page));
		const preference = page.getByRole('checkbox', { name: 'Open Fukushu when starting Misskey from Home' });
		const library = page.getByRole('heading', { name: 'Fukushu · Materials' });
		await page.goto(BASE_URL + '/fukushu');
		await expect(preference).not.toBeChecked();
		await preference.check();

		await page.goto(BASE_URL + '/');
		await expect(library).toBeVisible();
		await expect(page).toHaveURL(BASE_URL + '/');
		await page.getByRole('button', { name: 'Close', exact: true }).last().click();
		await expect(library).toHaveCount(0);

		await page.goto(BASE_URL + '/fukushu');
		await expect(preference).toBeChecked();
		await preference.uncheck();
		await page.goto(BASE_URL + '/');
		await expect(page.getByTestId('open-post-form').first()).toBeVisible();
		await expect(library).toHaveCount(0);
	});

	test('persists the Fukushu reminder time and zone and allows turning it off', async ({ page }) => {
		const setupClose = page.getByTestId('user-setup-dialog').getByTestId('modal-window-close');
		await page.addLocatorHandler(setupClose, () => closeUserSetupDialog(page));
		await page.goto(BASE_URL + '/fukushu');
		const settings = page.getByText('Review reminders', { exact: true });
		await settings.click();
		const enable = page.getByRole('checkbox', { name: 'Notify me on days when cards are due' });
		await expect(enable).not.toBeChecked();
		await enable.check();
		await page.getByLabel('Reminder time').fill('17:35');
		await page.getByLabel('Time zone (e.g. Europe/London)').fill('Asia/Tokyo');
		const save = page.getByRole('button', { name: 'Save reminder settings' });
		await save.click();
		await expect(page.getByText('Settings saved.')).toBeVisible();
		await page.reload();
		await settings.click();
		await expect(enable).toBeChecked();
		await expect(page.getByLabel('Reminder time')).toHaveValue('17:35');
		await expect(page.getByLabel('Time zone (e.g. Europe/London)')).toHaveValue('Asia/Tokyo');
		await enable.uncheck();
		await save.click();
		await expect(page.getByText('Settings saved.')).toBeVisible();
	});

	test.describe('Redirect', () => {
		test('redirect to user profile', async ({ page }) => {
			await page.goto(`${BASE_URL}/redirect-test`);
			await page.waitForURL('**/@alice');
		});
	});
});
