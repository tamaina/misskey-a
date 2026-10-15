/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, userEvent, within } from 'storybook/test';
import PeerPayments from './PeerPayments.vue';
import { residenceClient, reviewParameters, reviewPeerClient, blocked } from './billing-review.fixtures.js';
import type { StoryObj } from '@storybook/vue3';

export const ResidenceRequired = {
	render: args => ({ components: { PeerPayments }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><PeerPayments v-bind="args" /></div>' }),
	args: { client: reviewPeerClient, residenceClient: residenceClient('empty'), currentUserId: 'synthetic-user', resolveUser: blocked },
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '読み込む' }));
		await expect(canvas.getByRole('button', { name: '送金内容を準備する' })).toBeDisabled();
	},
	parameters: { ...reviewParameters },
} satisfies StoryObj<typeof PeerPayments>;
