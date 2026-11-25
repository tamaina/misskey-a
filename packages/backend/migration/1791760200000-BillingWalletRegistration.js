/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BillingWalletRegistration1791760200000 {
	name = 'BillingWalletRegistration1791760200000';
	async up(queryRunner) {
		await queryRunner.query("CREATE TABLE \"billing_wallet\" (\"id\" character varying(32) NOT NULL, \"userId\" character varying(32) NOT NULL, \"chainId\" bigint NOT NULL, \"address\" character varying(42) NOT NULL, \"label\" character varying(128), \"createdAt\" bigint NOT NULL, \"updatedAt\" bigint NOT NULL, CONSTRAINT \"billing_wallet_updatedAt_check\" CHECK (\"updatedAt\" BETWEEN 0 AND 9007199254740991), CONSTRAINT \"billing_wallet_createdAt_check\" CHECK (\"createdAt\" BETWEEN 0 AND 9007199254740991), CONSTRAINT \"billing_wallet_address_check\" CHECK (\"address\" ~ '^0x[0-9a-f]{40}$'), CONSTRAINT \"billing_wallet_chain_check\" CHECK (\"chainId\" BETWEEN 1 AND 9007199254740991), CONSTRAINT \"billing_wallet_pk\" PRIMARY KEY (\"id\"))");
		await queryRunner.query("CREATE UNIQUE INDEX \"billing_wallet_chain_address_key\" ON \"billing_wallet\"  (\"chainId\", \"address\") ");
		await queryRunner.query("CREATE INDEX \"billing_wallet_user_idx\" ON \"billing_wallet\"  (\"userId\") ");
		await queryRunner.query("CREATE TABLE \"billing_wallet_challenge\" (\"nonce\" character varying(128) NOT NULL, \"userId\" character varying(32) NOT NULL, \"chainId\" bigint NOT NULL, \"address\" character varying(42) NOT NULL, \"domain\" character varying(2048) NOT NULL, \"uri\" character varying(2048) NOT NULL, \"message\" character varying(4096) NOT NULL, \"createdAt\" bigint NOT NULL, \"expiresAt\" bigint NOT NULL, \"usedAt\" bigint, CONSTRAINT \"billing_wallet_challenge_usedAt_check\" CHECK (\"usedAt\" BETWEEN 0 AND 9007199254740991), CONSTRAINT \"billing_wallet_challenge_expiresAt_check\" CHECK (\"expiresAt\" BETWEEN 0 AND 9007199254740991), CONSTRAINT \"billing_wallet_challenge_createdAt_check\" CHECK (\"createdAt\" BETWEEN 0 AND 9007199254740991), CONSTRAINT \"billing_wallet_challenge_address_check\" CHECK (\"address\" ~ '^0x[0-9a-f]{40}$'), CONSTRAINT \"billing_wallet_challenge_chain_check\" CHECK (\"chainId\" BETWEEN 1 AND 9007199254740991), CONSTRAINT \"billing_wallet_challenge_pk\" PRIMARY KEY (\"nonce\"))");
		await queryRunner.query("CREATE INDEX \"billing_wallet_challenge_expires_idx\" ON \"billing_wallet_challenge\"  (\"expiresAt\") ");
		await queryRunner.query("CREATE INDEX \"billing_wallet_challenge_user_idx\" ON \"billing_wallet_challenge\"  (\"userId\") ");
		await queryRunner.query("ALTER TABLE \"billing_wallet\" ADD CONSTRAINT \"billing_wallet_user_fk\" FOREIGN KEY (\"userId\") REFERENCES \"user\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
		await queryRunner.query("ALTER TABLE \"billing_wallet_challenge\" ADD CONSTRAINT \"billing_wallet_challenge_user_fk\" FOREIGN KEY (\"userId\") REFERENCES \"user\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
	}
	async down(queryRunner) {
		await queryRunner.query('DROP TABLE "billing_wallet_challenge"');
		await queryRunner.query('DROP TABLE "billing_wallet"');
	}
}
