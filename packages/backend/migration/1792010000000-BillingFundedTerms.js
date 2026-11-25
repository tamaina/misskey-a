/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingFundedTerms1792010000000 {
	name = 'BillingFundedTerms1792010000000';
	async up(qr) {
		await qr.query(`CREATE TABLE billing_transaction_claim ("chainId" bigint NOT NULL, "txHash" varchar(66) NOT NULL, "ownerId" varchar(128) NOT NULL, CONSTRAINT billing_transaction_claim_pk PRIMARY KEY ("chainId", "txHash"))`);
		await qr.query(`INSERT INTO billing_transaction_claim ("chainId", "txHash", "ownerId") SELECT "chainId", "txHash", id FROM billing_service_order WHERE status = 'paid' AND "txHash" IS NOT NULL`);
		await qr.query(`CREATE TABLE "billing_account_state" ("userId" varchar(32) NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "billing_account_state_pk" PRIMARY KEY ("userId"), CONSTRAINT "billing_account_state_user_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
		await qr.query(`ALTER TABLE billing_service_order ADD COLUMN quote jsonb, ADD COLUMN "billingRevision" bigint, ADD COLUMN "cashAmountBaseUnits" varchar(78)`);
		await qr.query(`ALTER TABLE billing_service_order DROP CONSTRAINT billing_service_order_period_check`);
		await qr.query(`ALTER TABLE billing_service_order ADD CONSTRAINT billing_service_order_period_check CHECK (("status" = 'paid' AND ("txHash" IS NOT NULL OR "cashAmountBaseUnits" = '0') AND "paidAt" IS NOT NULL AND "startsAt" IS NOT NULL AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt") OR ("status" <> 'paid' AND "paidAt" IS NULL AND "startsAt" IS NULL AND "endsAt" IS NULL))`);
	}
	async down(qr) {
		// Zero-payable rows cannot be represented by the old schema. Refuse destructive rollback.
		await qr.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM billing_service_order WHERE status = 'paid' AND "txHash" IS NULL) THEN RAISE EXCEPTION 'Zero-payable terms prevent funded-term rollback'; END IF; END $$`);
		await qr.query(`ALTER TABLE billing_service_order DROP CONSTRAINT billing_service_order_period_check`);
		await qr.query(`ALTER TABLE billing_service_order ADD CONSTRAINT billing_service_order_period_check CHECK (("status" = 'paid' AND "txHash" IS NOT NULL AND "paidAt" IS NOT NULL AND "startsAt" IS NOT NULL AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt") OR ("status" <> 'paid' AND "paidAt" IS NULL AND "startsAt" IS NULL AND "endsAt" IS NULL))`);
		await qr.query(`ALTER TABLE billing_service_order DROP COLUMN quote, DROP COLUMN "billingRevision", DROP COLUMN "cashAmountBaseUnits"`);
		await qr.query('DROP TABLE billing_transaction_claim');
		await qr.query('DROP TABLE billing_account_state');
	}
}
