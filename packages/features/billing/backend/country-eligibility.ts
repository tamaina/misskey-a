/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ORPCError } from '@orpc/server';
import * as v from 'valibot';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBillingPolicy } from './models/BillingPolicy.js';
import { countryEligibilityPolicy } from './policy.schema.js';
import { peerReceiptSettings } from './residence.schema.js';
import { readyResidence, requireDeclaredResidence } from './residence-store.js';
import type { CountryEligibilityPolicy } from './policy.schema.js';
import type { DeclaredResidence, PeerReceiptSettings } from './residence.schema.js';
import type { EntityManager } from 'typeorm';

/** Private evidence, never included in sender/public payment projections. */
export type CountryEligibilityEvidence = {
	policyRevision: number;
	policy: CountryEligibilityPolicy;
	sender: DeclaredResidence;
	recipient: DeclaredResidence | null;
	recipientReceiptSettings: PeerReceiptSettings | null;
};
export function countryAllowed(policy: CountryEligibilityPolicy, country: string): boolean {
	return policy.mode === 'domestic' ? country === policy.operatorCountry : policy.allowedCountries.includes(country as CountryEligibilityPolicy['operatorCountry']);
}

function unavailable(): never { throw new ORPCError('BILLING_COUNTRY_UNAVAILABLE'); }

/** Policy/residence/preference writers share this transaction lock. Never apply to hash recovery. */
export async function requireCountryEligibility(manager: EntityManager, senderUserId: string, recipientUserId?: string): Promise<CountryEligibilityEvidence> {
	const sender = await requireDeclaredResidence(manager, senderUserId);
	const row = await manager.findOneBy(MiBillingPolicy, { id: 'server' });
	const parsed = v.safeParse(countryEligibilityPolicy, row?.policy?.countryEligibility);
	if (!row || !Number.isSafeInteger(row.revision) || row.revision < 0 || !parsed.success || !countryAllowed(parsed.output, sender.country)) unavailable();
	const evidence: CountryEligibilityEvidence = { policyRevision: row.revision, policy: parsed.output, sender, recipient: null, recipientReceiptSettings: null };
	if (recipientUserId === undefined) return evidence;
	const recipientRow = await manager.getRepository(MiUserProfile).findOne({ where: { userId: recipientUserId }, select: { userId: true, billingResidence: true, billingPeerReceiptSettings: true } });
	const recipient = readyResidence(recipientRow?.billingResidence, row.policy.residenceRequiredSubdivisions ?? []);
	if (!recipient || !countryAllowed(parsed.output, recipient.country)) unavailable();
	const settings = v.safeParse(peerReceiptSettings, recipientRow?.billingPeerReceiptSettings);
	const receipt = settings.success ? settings.output : { revision: 0, acceptForeignPayments: false };
	if (sender.country !== recipient.country && !receipt.acceptForeignPayments) unavailable();
	return { ...evidence, recipient, recipientReceiptSettings: receipt };
}
