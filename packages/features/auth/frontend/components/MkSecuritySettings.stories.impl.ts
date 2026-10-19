/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { expect, userEvent, within } from '@storybook/test';
import { HttpResponse, http } from 'msw';
import * as account from '../i.js';
import MkSecuritySettings from './MkSecuritySettings.vue';

const initialState = {
	totpEnabled: false, passkeyMfaEnabled: false, passkeyCount: 1,
	passwordlessEnabled: false, passwordLoginDisabled: false,
	hasVerifiedRecoveryEmail: true, recoveryCodesRemaining: 5,
};
const backupCodes = Array.from({ length: 5 }, (_, index) => `synthetic-recovery-${index + 1}`);

function handlers(state: typeof initialState) {
	return [
		http.post('*/api/i/registry/keys', () => HttpResponse.json([])),
		http.post('*/api/i/registry/get-all', () => HttpResponse.json({})),
		http.post('*/api/i/security/state', () => HttpResponse.json(state)),
		http.post('*/api/i/sudo/status', () => HttpResponse.json({ active: true, expiresAt: new Date(Date.now() + 300_000).toISOString() })),
		http.post('*/api/i/security/keys/list', () => HttpResponse.json(state.passkeyCount ? [{ id: 'AQID', name: 'Synthetic security key', lastUsedAt: '2026-10-18T00:00:00.000Z' }] : [])),
		http.post('*/api/i/security/passkey/mfa/start', () => HttpResponse.json({ ticket: 't'.repeat(43), options: { challenge: 'c3ludGhldGlj', rpId: 'localhost', userVerification: 'preferred', allowCredentials: [{ id: 'AQID', type: 'public-key' }] }, backupCodes })),
		http.post('*/api/i/security/totp/start', () => HttpResponse.json({ secret: 'JBSWY3DPEHPK3PXP', url: 'otpauth://totp/Storybook:synthetic?secret=JBSWY3DPEHPK3PXP&issuer=Storybook' })),
		http.post('*/api/i/security/recovery-codes', () => HttpResponse.json({ backupCodes })),
		// Completion and every unlisted API fail locally; no real changes or native ceremonies are exercised.
		http.all(`${window.location.origin}/api/*`, () => HttpResponse.json({ error: { code: 'STORYBOOK_ONLY', message: 'No real security changes in Storybook' } }, { status: 403 })),
	];
}

export const Default = {
	render() {
		return {
			components: { MkSecuritySettings },
			setup() {
				if (!account.$i) throw new Error('Storybook synthetic account required');
				account.$i.token = 'bs_storybook_synthetic_security';
				return {};
			},
			template: '<div style="width: min(640px, 100vw); max-height: 100vh; overflow: auto; padding: 24px; box-sizing: border-box"><MkSecuritySettings /></div>',
		};
	},
	parameters: { layout: 'centered', msw: { handlers: handlers(initialState) } },
} satisfies StoryObj<typeof MkSecuritySettings>;
export const TotpWithLowRecoveryCodes = {
	...Default,
	parameters: { layout: 'centered', msw: { handlers: handlers({ ...initialState, totpEnabled: true, passkeyCount: 0, recoveryCodesRemaining: 2 }) } },
} satisfies StoryObj<typeof MkSecuritySettings>;
export const IndependentPasskey = {
	...Default,
	parameters: { layout: 'centered', msw: { handlers: handlers({ ...initialState, passkeyMfaEnabled: true }) } },
} satisfies StoryObj<typeof MkSecuritySettings>;
export const PasswordLoginDisabled = {
	...Default,
	parameters: { layout: 'centered', msw: { handlers: handlers({ ...initialState, passwordlessEnabled: true, passwordLoginDisabled: true }) } },
} satisfies StoryObj<typeof MkSecuritySettings>;
export const RecoveryAcknowledgement = {
	...Default,
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: 'パスキーによる多要素認証を有効にする' }));
		for (const code of backupCodes) await expect(canvas.findByText(code)).resolves.toBeVisible();
		const prove = await canvas.findByRole('button', { name: 'パスキーで確認して有効にする' });
		expect(prove).toBeDisabled();
		await userEvent.click(await canvas.findByText('復旧コードを安全な場所に保存しました'));
		expect(prove).toBeEnabled();
		// Stop before the native authenticator: this story captures explicit acknowledgement only.
	},
} satisfies StoryObj<typeof MkSecuritySettings>;
export const TotpSetup = {
	...Default,
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '認証アプリを設定' }));
		await expect(canvas.findByText('JBSWY3DPEHPK3PXP')).resolves.toBeVisible();
	},
} satisfies StoryObj<typeof MkSecuritySettings>;
