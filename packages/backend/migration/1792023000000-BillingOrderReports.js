/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingOrderReports1792023000000 {
	name = 'BillingOrderReports1792023000000';
	async up(qr) {
		await qr.query('CREATE INDEX billing_service_order_status_paid_at ON billing_service_order (status, "paidAt")');
		await qr.query('CREATE INDEX billing_service_order_user_id ON billing_service_order ("userId", id)');
	}
	async down(qr) {
		await qr.query('DROP INDEX billing_service_order_user_id');
		await qr.query('DROP INDEX billing_service_order_status_paid_at');
	}
}
