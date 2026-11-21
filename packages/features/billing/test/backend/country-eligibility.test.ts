/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { requireCountryEligibility, countryAllowed } from '../../backend/country-eligibility.js';
import { countryEligibilityPolicy } from '../../backend/policy.schema.js';
import type { EntityManager } from 'typeorm';
import type { DeclaredResidence } from '../../backend/residence.schema.js';
const residence = (country: 'CA' | 'US'): DeclaredResidence => ({ country, subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' });

function fixture() {
	const profiles: Record<string, { billingResidence: DeclaredResidence | null; billingPeerReceiptSettings?: unknown }> = { alice: { billingResidence: residence('CA') }, bob: { billingResidence: residence('CA') } };
	const state: { policy: unknown; revision: number; required: string[] } = { policy: { operatorCountry: 'CA', mode: 'domestic', allowedCountries: [] }, revision: 2, required: [] };
	const lock = vi.fn(async () => []);
	const manager = { query: lock, getRepository: () => ({ findOne: async ({ where }: { where: { userId: string } }) => profiles[where.userId] }), findOneBy: async () => ({ revision: state.revision, policy: { countryEligibility: state.policy, residenceRequiredSubdivisions: state.required } }) } as unknown as EntityManager;
	return { manager, state, profiles, lock };
}

test('country policy requires an explicit operator country, valid unique countries and explicit override; no Japan fallback', () => {
	for (const value of [null, {}, { operatorCountry: 'ZZ', mode: 'domestic', allowedCountries: [] }, { operatorCountry: 'CA', mode: 'allow', allowedCountries: [] }, { operatorCountry: 'CA', mode: 'allow', allowedCountries: ['US', 'US'] }, { operatorCountry: 'CA', mode: 'domestic', allowedCountries: ['US'] }]) expect(v.safeParse(countryEligibilityPolicy, value).success).toBe(false);
	expect(countryAllowed({ operatorCountry: 'CA', mode: 'domestic', allowedCountries: [] }, 'CA')).toBe(true);
	expect(countryAllowed({ operatorCountry: 'CA', mode: 'domestic', allowedCountries: [] }, 'JP')).toBe(false);
	expect(countryAllowed({ operatorCountry: 'CA', mode: 'allow', allowedCountries: ['US'] }, 'CA')).toBe(false);
});
test('new purchase requires complete declared residence and configured country permission independently of tax enablement', async () => {
	const { manager, state, profiles, lock } = fixture();
	const evidence = await requireCountryEligibility(manager, 'alice');
	expect(evidence).toMatchObject({ policyRevision: 2, sender: residence('CA'), recipient: null });
	expect(lock).toHaveBeenCalledWith(expect.stringContaining('billing-policy'));
	state.policy = undefined; await expect(requireCountryEligibility(manager, 'alice')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
	state.policy = { operatorCountry: 'US', mode: 'domestic', allowedCountries: [] }; await expect(requireCountryEligibility(manager, 'alice')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
	profiles.alice.billingResidence = null; await expect(requireCountryEligibility(manager, 'alice')).rejects.toMatchObject({ code: 'RESIDENCE_REQUIRED' });
	profiles.alice.billingResidence = residence('US'); state.required = ['US']; await expect(requireCountryEligibility(manager, 'alice')).rejects.toMatchObject({ code: 'RESIDENCE_REQUIRED' });
});
test('same-country P2P works with default OFF, cross-country requires recipient explicit ON and both server permissions', async () => {
	const { manager, state, profiles } = fixture();
	expect((await requireCountryEligibility(manager, 'alice', 'bob')).recipientReceiptSettings).toEqual({ revision: 0, acceptForeignPayments: false });
	state.policy = { operatorCountry: 'CA', mode: 'allow', allowedCountries: ['CA', 'US'] };
	profiles.bob.billingResidence = residence('US');
	for (const settings of [undefined, null, {}, { revision: 1, acceptForeignPayments: false }]) {
		profiles.bob.billingPeerReceiptSettings = settings;
		await expect(requireCountryEligibility(manager, 'alice', 'bob')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
	}
	profiles.bob.billingPeerReceiptSettings = { revision: 1, acceptForeignPayments: true };
	const before = await requireCountryEligibility(manager, 'alice', 'bob');
	expect(before.recipient?.country).toBe('US');
	state.policy = { operatorCountry: 'CA', mode: 'domestic', allowedCountries: [] }; await expect(requireCountryEligibility(manager, 'alice', 'bob')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
	expect(before.policy.mode).toBe('allow');
});
test('recipient missing/incomplete declarations and opt-out are generic new-start refusals; evidence records current revisions', async () => {
	const { manager, state, profiles } = fixture();
	state.policy = { operatorCountry: 'CA', mode: 'allow', allowedCountries: ['CA', 'US'] };
	profiles.bob.billingResidence = residence('US'); profiles.bob.billingPeerReceiptSettings = { revision: 1, acceptForeignPayments: true };
	await requireCountryEligibility(manager, 'alice', 'bob');
	profiles.bob.billingPeerReceiptSettings = { revision: 2, acceptForeignPayments: false };
	await expect(requireCountryEligibility(manager, 'alice', 'bob')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
	profiles.bob.billingResidence = null; await expect(requireCountryEligibility(manager, 'alice', 'bob')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
	profiles.bob.billingResidence = residence('US'); state.required = ['US']; await expect(requireCountryEligibility(manager, 'alice', 'bob')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
	await expect(requireCountryEligibility(manager, 'alice', 'missing')).rejects.toMatchObject({ code: 'BILLING_COUNTRY_UNAVAILABLE' });
});
