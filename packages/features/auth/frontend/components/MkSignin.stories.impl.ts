/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { HttpResponse, http } from 'msw';
import { userDetailed } from '../../../../frontend/.storybook/fakes.js';
import MkSignin from './MkSignin.vue';

const handlers = [
	http.post('*/api/users/show', () => HttpResponse.json({ ...userDetailed('synthetic-user', 'synthetic', null, 'Synthetic account'), avatarUrl: '/client-assets/unknown.png', avatarDecorations: [], bannerUrl: null })),
	http.post('*/api/signin-flow', async ({ request }) => {
		const body = await request.json() as { password?: string };
		return HttpResponse.json(body.password ? {
			finished: false, next: 'passkey', availableFactors: ['totp', 'passkey', 'recovery'],
			authenticationProgress: { ticket: 't'.repeat(43), browserSecret: 'b'.repeat(43), nonce: 'n'.repeat(43), version: 0 },
			authRequest: { challenge: 'c3ludGhldGlj', rpId: 'localhost', userVerification: 'preferred' },
		} : { finished: false, next: 'password' });
	}),
	http.all(`${window.location.origin}/api/*`, () => HttpResponse.json({ error: { code: 'STORYBOOK_ONLY', message: 'No real sign-in in Storybook' } }, { status: 403 })),
];
export const Username = {
	render(args) { return { components: { MkSignin }, setup() { return { args }; }, template: '<div style="width: min(420px, 100vw); padding: 24px; box-sizing: border-box"><MkSignin v-bind="args" /></div>' }; },
	args: { autoSet: false, initialUsername: 'synthetic' },
	parameters: { layout: 'centered', msw: { handlers } },
} satisfies StoryObj<typeof MkSignin>;
export const TotpFirst = {
	...Username,
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByTestId('signin-page-input-continue'));
		await canvas.findByTestId('signin-password');
		const password = canvasElement.querySelector<HTMLInputElement>('input[type="password"]');
		if (!password) throw new Error('Synthetic password input missing');
		await userEvent.type(password, 'synthetic-password');
		await userEvent.click(await canvas.findByTestId('signin-page-password-continue'));
		await waitFor(async () => { await expect(await canvas.findByText('二要素認証', { exact: true })).toBeVisible(); });
	},
} satisfies StoryObj<typeof MkSignin>;
