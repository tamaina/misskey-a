/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class AccountDeclaredResidence1792100000000 {
	name = 'AccountDeclaredResidence1792100000000';
	async up(qr) { await qr.query('ALTER TABLE user_profile ADD "billingResidence" jsonb'); await qr.query('ALTER TABLE billing_service_order ADD "declaredResidence" jsonb'); }
	async down(qr) {
		if ((await qr.query('SELECT 1 FROM billing_service_order WHERE "declaredResidence" IS NOT NULL LIMIT 1')).length) throw new Error('Retain purchase residence evidence before rollback');
		if ((await qr.query('SELECT 1 FROM user_profile WHERE "billingResidence" IS NOT NULL LIMIT 1')).length) throw new Error('Retain declared residence evidence before rollback');
		await qr.query('ALTER TABLE billing_service_order DROP COLUMN "declaredResidence"');
		await qr.query('ALTER TABLE user_profile DROP COLUMN "billingResidence"');
	}
}
