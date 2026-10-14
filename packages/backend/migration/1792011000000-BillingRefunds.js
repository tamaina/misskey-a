/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingRefunds1792011000000 {
	name = 'BillingRefunds1792011000000';
	async up(qr) {
		await qr.query(`CREATE TABLE billing_refund (id varchar(32) NOT NULL, "userId" varchar(32), "requestKey" varchar(128) NOT NULL, data jsonb NOT NULL, CONSTRAINT billing_refund_pk PRIMARY KEY (id), CONSTRAINT billing_refund_user_fk FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE SET NULL ON UPDATE NO ACTION)`);
		await qr.query(`CREATE UNIQUE INDEX billing_refund_request_key ON billing_refund ("userId", "requestKey")`);
	}
	async down(qr) {
		await qr.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM billing_refund WHERE data->>'status' IN ('processing','completed')) THEN RAISE EXCEPTION 'Broadcast/completed refunds prevent destructive rollback'; END IF; END $$`);
		await qr.query('DROP TABLE billing_refund');
	}
}
