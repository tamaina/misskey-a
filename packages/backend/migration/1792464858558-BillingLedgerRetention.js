/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingLedgerRetention1792464858558 {
	name = 'BillingLedgerRetention1792464858558';
	async up(qr) {
		// This historical billing key survives account deletion without retaining the user/profile row.
		await qr.query('ALTER TABLE billing_account_state DROP CONSTRAINT billing_account_state_user_fk');
		await qr.query(`CREATE FUNCTION billing_reject_ledger_deletion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Billing ledger records cannot be deleted; use linked cancellation/refund records' USING ERRCODE = '23514'; END $$`);
		for (const table of ['billing_service_order', 'billing_refund', 'billing_transaction_claim', 'billing_account_state']) {
			await qr.query(`CREATE TRIGGER ${table}_retain BEFORE DELETE OR TRUNCATE ON ${table} FOR EACH STATEMENT EXECUTE FUNCTION billing_reject_ledger_deletion()`);
		}
	}
	async down(qr) {
		// Reintroducing the user FK is impossible once a retained billing account has no user row.
		await qr.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM billing_account_state state LEFT JOIN "user" account ON account.id = state."userId" WHERE account.id IS NULL) THEN RAISE EXCEPTION 'Retained billing accounts prevent rollback to account-cascaded storage'; END IF; END $$`);
		for (const table of ['billing_service_order', 'billing_refund', 'billing_transaction_claim', 'billing_account_state']) {
			await qr.query(`DROP TRIGGER ${table}_retain ON ${table}`);
		}
		await qr.query('DROP FUNCTION billing_reject_ledger_deletion()');
		await qr.query('ALTER TABLE billing_account_state ADD CONSTRAINT billing_account_state_user_fk FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE ON UPDATE NO ACTION');
	}
}
