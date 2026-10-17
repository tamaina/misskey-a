/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BillingWalletChainSettings1791763800000 {
	name = 'BillingWalletChainSettings1791763800000';
	async up(queryRunner) {
		await queryRunner.query("CREATE TABLE \"billing_wallet_chain\" (\"chainId\" bigint NOT NULL, \"name\" character varying(128) NOT NULL, \"nativeCurrencyName\" character varying(128) NOT NULL, \"nativeCurrencySymbol\" character varying(128) NOT NULL, \"nativeCurrencyDecimals\" integer NOT NULL, \"blockExplorerUrl\" character varying(2048), \"isEnabled\" boolean NOT NULL DEFAULT false, \"rpcUrl\" character varying(2048), \"updatedAt\" bigint NOT NULL, \"updatedByUserId\" character varying(32), CONSTRAINT \"billing_wallet_chain_updatedAt_check\" CHECK (\"updatedAt\" BETWEEN 0 AND 9007199254740991), CONSTRAINT \"billing_wallet_chain_decimals_check\" CHECK (\"nativeCurrencyDecimals\" BETWEEN 0 AND 255), CONSTRAINT \"billing_wallet_chain_id_check\" CHECK (\"chainId\" BETWEEN 1 AND 9007199254740991), CONSTRAINT \"billing_wallet_chain_pk\" PRIMARY KEY (\"chainId\"))");
		await queryRunner.query("ALTER TABLE \"billing_wallet_chain\" ADD CONSTRAINT \"billing_wallet_chain_actor_fk\" FOREIGN KEY (\"updatedByUserId\") REFERENCES \"user\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
	}
	async down(queryRunner) {
		await queryRunner.query('DROP TABLE "billing_wallet_chain"');
	}
}
