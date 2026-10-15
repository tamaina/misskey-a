/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, userEvent, within } from 'storybook/test';
import ServiceSubscriptions from './ServiceSubscriptions.vue';
import { residenceClient, reviewParameters, reviewServiceClient, reviewWallet } from './billing-review.fixtures.js';
import type { StoryObj } from '@storybook/vue3';

export const ResidenceRequired = {
	render: args => ({ components: { ServiceSubscriptions }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><ServiceSubscriptions v-bind="args" /></div>' }),
	args: { client: reviewServiceClient, residenceClient: residenceClient('empty'), listWallets: async () => [reviewWallet] },
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '読み込む' }));
		await expect(canvas.getByRole('button', { name: '注文を作成' })).toBeDisabled();
	},
	parameters: { ...reviewParameters },
} satisfies StoryObj<typeof ServiceSubscriptions>;
