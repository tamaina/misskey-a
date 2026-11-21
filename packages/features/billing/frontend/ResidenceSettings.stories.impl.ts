/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import ResidenceSettings from './ResidenceSettings.vue';
import { residenceClient, reviewParameters } from './billing-review.fixtures.js';
import type { StoryObj } from '@storybook/vue3';

export const Unset = {
	render: args => ({ components: { ResidenceSettings }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><ResidenceSettings v-bind="args" /></div>' }),
	args: { client: residenceClient('empty') },
	parameters: { ...reviewParameters },
} satisfies StoryObj<typeof ResidenceSettings>;
export const Registered = {
	render: args => ({ components: { ResidenceSettings }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><ResidenceSettings v-bind="args" /></div>' }),
	args: { client: residenceClient('registered') },
	parameters: { ...reviewParameters },
} satisfies StoryObj<typeof ResidenceSettings>;
export const RequiredSubdivisionMissing = {
	render: args => ({ components: { ResidenceSettings }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><ResidenceSettings v-bind="args" /></div>' }),
	args: { client: residenceClient('subdivision') },
	parameters: { ...reviewParameters },
} satisfies StoryObj<typeof ResidenceSettings>;

export const OverseasEnabled = {
	...Registered,
	args: { client: { ...residenceClient('registered'), getPeerReceiptSettings: async () => ({ revision: 3, acceptForeignPayments: true }) } },
} satisfies StoryObj<typeof ResidenceSettings>;
