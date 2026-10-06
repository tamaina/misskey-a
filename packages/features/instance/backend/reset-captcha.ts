/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const resetValues = {
	enableHcaptcha: false,
	hcaptchaSiteKey: null,
	hcaptchaSecretKey: null,
	enableMcaptcha: false,
	mcaptchaSitekey: null,
	mcaptchaSecretKey: null,
	mcaptchaInstanceUrl: null,
	enableRecaptcha: false,
	recaptchaSiteKey: null,
	recaptchaSecretKey: null,
	enableTurnstile: false,
	turnstileSiteKey: null,
	turnstileSecretKey: null,
	enableTestcaptcha: false,
} as const;

export type CaptchaReset = typeof resetValues;

/** An administrative command; the caller owns authorization and resource lifetime. */
export function createResetCaptcha(update: (patch: CaptchaReset) => Promise<unknown>) {
	return async () => { await update({ ...resetValues }); };
}
