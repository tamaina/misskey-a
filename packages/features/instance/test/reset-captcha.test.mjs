/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createResetCaptcha } from '../built/backend/index.js';

test('captcha reset changes only the existing captcha fields', async () => {
	let patch;
	await createResetCaptcha(async value => { patch = value; })();
	assert.deepEqual(patch, {
		enableHcaptcha: false, hcaptchaSiteKey: null, hcaptchaSecretKey: null,
		enableMcaptcha: false, mcaptchaSitekey: null, mcaptchaSecretKey: null, mcaptchaInstanceUrl: null,
		enableRecaptcha: false, recaptchaSiteKey: null, recaptchaSecretKey: null,
		enableTurnstile: false, turnstileSiteKey: null, turnstileSecretKey: null,
		enableTestcaptcha: false,
	});
});
test('each execution gets an independent patch and awaits persistence', async () => {
	let calls = 0;
	const reset = createResetCaptcha(async patch => {
		assert.equal(patch.enableHcaptcha, false);
		patch.enableHcaptcha = true;
		await Promise.resolve(); calls++;
	});
	await reset(); await reset(); assert.equal(calls, 2);
});
test('persistence and publication errors are not swallowed', async () => {
	const error = new Error('update failed');
	await assert.rejects(createResetCaptcha(async () => { throw error; })(), e => e === error);
});
