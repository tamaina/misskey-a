/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingNotifications1792022000000 {
	name = 'BillingNotifications1792022000000';
	async up(qr) {
		await qr.query('CREATE TABLE billing_notification ("eventKey" varchar(128) NOT NULL, "userId" varchar(32), "createdAt" timestamptz NOT NULL, CONSTRAINT billing_notification_pk PRIMARY KEY ("eventKey"), CONSTRAINT billing_notification_user_fk FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE SET NULL)');
	}
	async down(qr) {
		if (BigInt((await qr.query('SELECT count(*) AS count FROM billing_notification'))[0].count) !== 0n) throw new Error('Cannot discard billing notification reservations');
		await qr.query('DROP TABLE billing_notification');
	}
}
