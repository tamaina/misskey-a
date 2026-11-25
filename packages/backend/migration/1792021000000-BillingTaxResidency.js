/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingTaxResidency1792021000000 {
	name = 'BillingTaxResidency1792021000000';
	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE billing_policy (id varchar(32) NOT NULL, revision integer NOT NULL, policy jsonb NOT NULL, "updatedAt" timestamptz NOT NULL, "updatedByUserId" varchar(32), CONSTRAINT billing_policy_pk PRIMARY KEY (id), CONSTRAINT billing_policy_actor_fk FOREIGN KEY ("updatedByUserId") REFERENCES "user"(id) ON DELETE SET NULL)`);
		await queryRunner.query(`CREATE TABLE billing_residency_statement (id varchar(32) NOT NULL, country varchar(2) NOT NULL, statement varchar(4096) NOT NULL, "isEnabled" boolean NOT NULL, "createdAt" timestamptz NOT NULL, "retiredAt" timestamptz, CONSTRAINT billing_residency_statement_pk PRIMARY KEY (id))`);
		await queryRunner.query(`CREATE UNIQUE INDEX billing_residency_statement_active_country ON billing_residency_statement (country) WHERE "isEnabled" = true`);
		await queryRunner.query(`ALTER TABLE billing_service_order ADD "receiptSnapshot" jsonb`);
	}
	async down(queryRunner) {
		const rows = await queryRunner.query(`SELECT (SELECT count(*) FROM billing_policy) + (SELECT count(*) FROM billing_residency_statement) + (SELECT count(*) FROM billing_service_order WHERE "receiptSnapshot" IS NOT NULL) AS count`);
		if (BigInt(rows[0].count) !== 0n) throw new Error('Cannot discard billing policy/residency/receipt evidence');
		await queryRunner.query(`ALTER TABLE billing_service_order DROP COLUMN "receiptSnapshot"`);
		await queryRunner.query('DROP TABLE billing_residency_statement');
		await queryRunner.query('DROP TABLE billing_policy');
	}
}
