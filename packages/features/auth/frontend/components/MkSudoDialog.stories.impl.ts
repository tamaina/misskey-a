/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { expect, userEvent, within } from '@storybook/test';
import { HttpResponse, http } from 'msw';
import * as account from '../i.js';
import MkSudoDialog from './MkSudoDialog.vue';

const sessionToken = 'bs_storybook_synthetic_sudo';
const initialState = {
	totpEnabled: false, passkeyMfaEnabled: false, passkeyCount: 0,
	passwordlessEnabled: false, passwordLoginDisabled: false,
	hasVerifiedRecoveryEmail: true, recoveryCodesRemaining: 5,
};

function handlers(state: typeof initialState) {
	return [
		http.post('*/api/i/registry/keys', () => HttpResponse.json([])),
		http.post('*/api/i/registry/get-all', () => HttpResponse.json({})),
		http.post('*/api/i/security/state', () => HttpResponse.json(state)),
		http.post('*/api/i/sudo/start', async ({ request }) => {
			const input = await request.json() as { password?: string; token?: string; usePasskey?: boolean };
			// Render the real passkey states without opening a native authenticator.
			if (input.usePasskey || !input.password || (state.totpEnabled && input.token !== '123456')) return HttpResponse.json({ error: { code: 'REAUTHENTICATION_FAILED', message: 'Synthetic confirmation rejected' } }, { status: 403 });
			return HttpResponse.json({ status: 'elevated', expiresAt: new Date(Date.now() + 300_000).toISOString(), grantId: 'g'.repeat(43) });
		}),
		http.post('*/api/i/sudo/exit', () => new HttpResponse(null, { status: 204 })),
		// No API request in this story may reach a real server.
		http.all('*/api/*', () => HttpResponse.json({ error: { code: 'STORYBOOK_ONLY', message: 'No real authentication in Storybook' } }, { status: 403 })),
	];
}

export const Password = {
	render(args) {
		return {
			components: { MkSudoDialog },
			setup() {
				if (!account.$i) throw new Error('Storybook synthetic account required');
				// Parent setup runs before the dialog captures its session owner.
				account.$i.token = sessionToken;
				return { args };
			},
			template: '<MkSudoDialog v-bind="args" />',
		};
	},
	args: { isCurrent: () => true },
	parameters: { layout: 'centered', msw: { handlers: handlers(initialState) } },
} satisfies StoryObj<typeof MkSudoDialog>;
export const TotpFirst = {
	...Password,
	parameters: { layout: 'centered', msw: { handlers: handlers({ ...initialState, totpEnabled: true, passkeyCount: 1 }) } },
} satisfies StoryObj<typeof MkSudoDialog>;
export const IndependentPasskey = {
	...Password,
	parameters: { layout: 'centered', msw: { handlers: handlers({ ...initialState, passkeyMfaEnabled: true, passkeyCount: 1 }) } },
} satisfies StoryObj<typeof MkSudoDialog>;
export const PasswordLoginDisabled = {
	...Password,
	parameters: { layout: 'centered', msw: { handlers: handlers({ ...initialState, passwordLoginDisabled: true, passwordlessEnabled: true, passkeyCount: 1 }) } },
} satisfies StoryObj<typeof MkSudoDialog>;

export const RejectedProof = {
	...TotpFirst,
	async play({ canvasElement }) {
		const canvas = within(canvasElement.ownerDocument.body);
		await canvas.findByRole('button', { name: /^確認して続ける$/ });
		const password = canvasElement.ownerDocument.querySelector<HTMLInputElement>('input[type="password"]');
		if (!password) throw new Error('Synthetic password input missing');
		await userEvent.type(password, 'synthetic-password');
		const token = canvasElement.ownerDocument.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]');
		if (!token) throw new Error('Synthetic factor input missing');
		await userEvent.type(token, '000000');
		await userEvent.click(canvas.getByRole('button', { name: /^確認して続ける$/ }));
		await expect(canvas.findByRole('alert')).resolves.toHaveTextContent('本人確認できませんでした');
	},
} satisfies StoryObj<typeof MkSudoDialog>;
export const Cancelled = {
	...Password,
	render(args) {
		return {
			components: { MkSudoDialog },
			setup() {
				if (!account.$i) throw new Error('Storybook synthetic account required');
				account.$i.token = sessionToken;
				const open = ref(true);
				const result = ref('');
				return { args, open, result, settle: (confirmed: boolean) => { result.value = confirmed ? '合成fixtureの本人確認が完了しました。操作は実行していません。' : '本人確認をキャンセルしました。操作は実行していません。'; open.value = false; } };
			},
			template: '<div><MkSudoDialog v-if="open" v-bind="args" @done="settle"/><p v-else role="status">{{ result }}</p></div>',
		};
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(await canvas.findByRole('button', { name: /^キャンセル$/ }));
		await expect(canvas.findByRole('status')).resolves.toHaveTextContent('操作は実行していません');
	},
} satisfies StoryObj<typeof MkSudoDialog>;
