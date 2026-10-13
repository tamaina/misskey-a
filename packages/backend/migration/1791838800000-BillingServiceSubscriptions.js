/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BillingServiceSubscriptions1791838800000 {
	name = 'BillingServiceSubscriptions1791838800000';
	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "billing_service_offer" ("id" varchar(32) NOT NULL, "terms" jsonb NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedByUserId" varchar(32), CONSTRAINT "billing_service_offer_pk" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "billing_service_order" ("id" varchar(32) NOT NULL, "userId" varchar(32), "requestKey" varchar(128) NOT NULL, "walletId" varchar(32) NOT NULL, "offer" jsonb NOT NULL, "chainId" bigint NOT NULL, "payerAddress" varchar(42) NOT NULL, "status" varchar(16) NOT NULL DEFAULT 'pending', "txHash" varchar(66), "createdAt" bigint NOT NULL, "expiresAt" bigint NOT NULL, "paidAt" bigint, "startsAt" bigint, "endsAt" bigint, CONSTRAINT "billing_service_order_status_check" CHECK ("status" IN ('pending','paid','expired','failed')), CONSTRAINT "billing_service_order_period_check" CHECK (("status" = 'paid' AND "txHash" IS NOT NULL AND "paidAt" IS NOT NULL AND "startsAt" IS NOT NULL AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt") OR ("status" <> 'paid' AND "paidAt" IS NULL AND "startsAt" IS NULL AND "endsAt" IS NULL)), CONSTRAINT "billing_service_order_pk" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "billing_service_order_request_key" ON "billing_service_order" ("userId", "requestKey")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "billing_service_order_transaction_key" ON "billing_service_order" ("chainId", "txHash") WHERE "status" = 'paid'`);
		await queryRunner.query(`ALTER TABLE "billing_service_offer" ADD CONSTRAINT "billing_service_offer_actor_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "billing_service_order" ADD CONSTRAINT "billing_service_order_user_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
	}
	async down(queryRunner) {
		await queryRunner.query('DROP TABLE "billing_service_order"');
		await queryRunner.query('DROP TABLE "billing_service_offer"');
	}
}
