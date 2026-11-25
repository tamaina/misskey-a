/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, userEvent, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import { userDetailed } from '../../../frontend/.storybook/fakes.js';
import PeerPayments from './PeerPayments.vue';
import { residenceClient, reviewParameters, reviewPeerClient } from './billing-review.fixtures.js';
import type { StoryObj } from '@storybook/vue3';

export const ResidenceRequired = {
	render: args => ({ components: { PeerPayments }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><PeerPayments v-bind="args" /></div>' }),
	args: { client: reviewPeerClient, residenceClient: residenceClient('empty'), currentUserId: 'synthetic-user' },
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await expect(await canvas.findByRole('button', { name: 'ウォレット・トークン・履歴を再読み込み' })).toBeEnabled();
		await expect(canvas.getByRole('button', { name: '送金内容を準備する' })).toBeDisabled();
	},
	parameters: { ...reviewParameters },
} satisfies StoryObj<typeof PeerPayments>;

const recipient = { ...userDetailed('synthetic-recipient', 'synthetic_recipient', null, 'Synthetic recipient'), avatarUrl: null, bannerUrl: null, avatarDecorations: [] };
export const RecipientWithoutWallet = {
	...ResidenceRequired,
	parameters: {
		...reviewParameters,
		msw: { handlers: [
			http.post('*/api/users/search-by-username-and-host', () => HttpResponse.json([recipient])),
			http.post('*/api/users/show', async ({ request }) => {
				const body = await request.json() as { userIds?: string[] };
				return HttpResponse.json(body.userIds ? [] : recipient);
			}),
			...reviewParameters.msw.handlers,
		] },
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement), screen = within(canvasElement.ownerDocument.body);
		await userEvent.click(await canvas.findByRole('button', { name: '選択' }));
		const usernameLabel = await screen.findByText('ユーザー名', { exact: true });
		await userEvent.type(within(usernameLabel.parentElement!).getByRole('combobox'), 'synthetic_recipient');
		await userEvent.click(await screen.findByText('Synthetic recipient', { exact: true }));
		await userEvent.click(await screen.findByRole('button', { name: /^完了/ }));
		await expect(await canvas.findByText('この受取人には公開された受取ウォレットがありません。')).toBeVisible();
		await expect(canvas.queryByRole('button', { name: /^選択$/ })).toBeNull();
		await expect(canvas.getByRole('button', { name: /^解除$/ })).toBeVisible();
	},
} satisfies StoryObj<typeof PeerPayments>;
