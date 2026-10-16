/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class PeerCountryEligibility1792138000001 {
	name = 'PeerCountryEligibility1792138000001';
	async up(qr) {
		await qr.query('ALTER TABLE billing_peer_intent ADD "countryEligibility" jsonb, ADD "broadcastCountryEligibility" jsonb');
	}
	async down(qr) {
		if ((await qr.query('SELECT 1 FROM billing_peer_intent WHERE "countryEligibility" IS NOT NULL OR "broadcastCountryEligibility" IS NOT NULL LIMIT 1')).length) throw new Error('Retain country eligibility evidence before rollback');
		await qr.query('ALTER TABLE billing_peer_intent DROP COLUMN "broadcastCountryEligibility", DROP COLUMN "countryEligibility"');
	}
}
