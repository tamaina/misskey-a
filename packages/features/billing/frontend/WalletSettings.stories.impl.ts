/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import WalletSettings from './WalletSettings.vue';
import { residenceClient, reviewParameters, reviewWalletClient, reviewConnectors } from './billing-review.fixtures.js';
import type { StoryObj } from '@storybook/vue3';

export const ResidenceRequired = {
	render: args => ({ components: { WalletSettings }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><WalletSettings v-bind="args" /></div>' }),
	args: { client: reviewWalletClient, residenceClient: residenceClient('empty'), connectors: reviewConnectors, confirmUnlink: async () => false },
	parameters: { ...reviewParameters },
} satisfies StoryObj<typeof WalletSettings>;
