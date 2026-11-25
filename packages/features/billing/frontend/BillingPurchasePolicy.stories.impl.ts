/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, userEvent, within } from 'storybook/test';
import BillingPurchasePolicy from './BillingPurchasePolicy.vue';
import { blocked, reviewParameters } from './billing-review.fixtures.js';
import type { StoryObj } from '@storybook/vue3';
import type { CountryEligibilityPolicy } from '../backend/policy.schema.js';

function client(countryEligibility?: CountryEligibilityPolicy) {
	return {
		getBillingPolicy: async () => ({ revision: 1, policy: {
			...(countryEligibility ? { countryEligibility } : {}),
			isEnabled: false, trustedProxyCidrs: [], regionRules: { mode: 'allow' as const, rules: [{ country: 'GB' }] },
			taxName: 'Synthetic tax', taxRate: '0', seller: { name: 'Synthetic seller', address: '', invoiceRegistrationNumber: '' }, statementText: 'Synthetic statement',
		} }), upsertBillingPolicy: blocked,
	};
}

export const CountryUnset = {
	render: args => ({ components: { BillingPurchasePolicy }, setup: () => ({ args }), template: '<div style="max-width: 720px; margin: auto"><BillingPurchasePolicy v-bind="args" /></div>' }),
	args: { client: client() }, parameters: { ...reviewParameters },
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '設定を読み込む' }));
		await expect(canvas.getByText('未設定では開始できません。', { exact: false })).toBeVisible();
	},
} satisfies StoryObj<typeof BillingPurchasePolicy>;
export const DomesticCountry = {
	...CountryUnset, args: { client: client({ operatorCountry: 'CA', mode: 'domestic', allowedCountries: [] }) },
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '設定を読み込む' }));
		await expect(await canvas.findByText('CA / カナダ', { exact: true })).toBeVisible();
	},
} satisfies StoryObj<typeof BillingPurchasePolicy>;
export const ExplicitCountries = {
	...DomesticCountry, args: { client: client({ operatorCountry: 'CA', mode: 'allow', allowedCountries: ['CA', 'US'] }) },
} satisfies StoryObj<typeof BillingPurchasePolicy>;
