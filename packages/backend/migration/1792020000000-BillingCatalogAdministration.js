/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class BillingCatalogAdministration1792020000000 {
	name = 'BillingCatalogAdministration1792020000000';
	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "billing_pricing_asset" ("id" varchar(32) NOT NULL, "pricingAssetKey" varchar(128) NOT NULL, "data" jsonb NOT NULL, "updatedAt" timestamptz NOT NULL, "updatedByUserId" varchar(32), CONSTRAINT "billing_pricing_asset_pk" PRIMARY KEY ("id"), CONSTRAINT "billing_pricing_asset_actor_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE SET NULL)`);
		await queryRunner.query(`CREATE UNIQUE INDEX "billing_pricing_asset_key" ON "billing_pricing_asset" ("pricingAssetKey")`);
		await queryRunner.query(`CREATE TABLE "billing_asset_deployment" ("id" varchar(32) NOT NULL, "assetId" varchar(32) NOT NULL, "chainId" bigint NOT NULL, "contractAddress" varchar(42) NOT NULL, "data" jsonb NOT NULL, "updatedAt" timestamptz NOT NULL, "updatedByUserId" varchar(32), CONSTRAINT "billing_asset_deployment_pk" PRIMARY KEY ("id"), CONSTRAINT "billing_asset_deployment_asset_fk" FOREIGN KEY ("assetId") REFERENCES "billing_pricing_asset"("id") ON DELETE CASCADE, CONSTRAINT "billing_asset_deployment_chain_fk" FOREIGN KEY ("chainId") REFERENCES "billing_wallet_chain"("chainId") ON DELETE CASCADE, CONSTRAINT "billing_asset_deployment_actor_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE SET NULL)`);
		await queryRunner.query(`CREATE UNIQUE INDEX "billing_asset_deployment_chain_contract" ON "billing_asset_deployment" ("chainId", "contractAddress")`);
		await queryRunner.query(`CREATE TABLE "billing_catalog_price" ("id" varchar(128) NOT NULL, "terms" jsonb NOT NULL, "updatedAt" timestamptz NOT NULL, "updatedByUserId" varchar(32), CONSTRAINT "billing_catalog_price_pk" PRIMARY KEY ("id"), CONSTRAINT "billing_catalog_price_actor_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE SET NULL)`);
		await queryRunner.query(`INSERT INTO "billing_catalog_price" SELECT DISTINCT ON (COALESCE("terms"->>'catalogPriceId', "id")) COALESCE("terms"->>'catalogPriceId', "id"), "terms", "updatedAt", "updatedByUserId" FROM "billing_service_offer" WHERE "terms"->>'priceStartsAt' IS NOT NULL ORDER BY COALESCE("terms"->>'catalogPriceId', "id"), "updatedAt" DESC`);
	}
	async down(queryRunner) {
		if (BigInt((await queryRunner.query(`SELECT (SELECT count(*) FROM "billing_pricing_asset") + (SELECT count(*) FROM "billing_catalog_price") AS count`))[0].count) !== 0n) throw new Error('Cannot discard configured billing assets; archive/export them before reverting');
		await queryRunner.query(`DROP TABLE "billing_catalog_price"`);
		await queryRunner.query(`DROP TABLE "billing_asset_deployment"`);
		await queryRunner.query(`DROP TABLE "billing_pricing_asset"`);
	}
}
