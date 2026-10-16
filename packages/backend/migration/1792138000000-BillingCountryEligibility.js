/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingCountryEligibility1792138000000 {
	name = 'BillingCountryEligibility1792138000000';
	async up(qr) {
		await qr.query('ALTER TABLE user_profile ADD "billingPeerReceiptSettings" jsonb');
		await qr.query('ALTER TABLE billing_service_order ADD "countryEligibility" jsonb');
	}
	async down(qr) {
		if ((await qr.query('SELECT 1 FROM billing_service_order WHERE "countryEligibility" IS NOT NULL LIMIT 1')).length) throw new Error('Retain country eligibility evidence before rollback');
		if ((await qr.query('SELECT 1 FROM user_profile WHERE "billingPeerReceiptSettings" IS NOT NULL LIMIT 1')).length) throw new Error('Retain recipient preferences before rollback');
		await qr.query('ALTER TABLE billing_service_order DROP COLUMN "countryEligibility"');
		await qr.query('ALTER TABLE user_profile DROP COLUMN "billingPeerReceiptSettings"');
	}
}
