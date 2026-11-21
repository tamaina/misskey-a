/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MailFoundation1794697200000 {
	name = 'MailFoundation1794697200000';
	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "mail_account" (
			"userId" varchar(32) NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "usedBytes" bigint NOT NULL DEFAULT 0,
			CONSTRAINT "PK_mail_account" PRIMARY KEY ("userId"),
			CONSTRAINT "CHK_mail_account_used" CHECK ("usedBytes" >= 0),
			CONSTRAINT "FK_mail_account_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
		)`);
		await queryRunner.query(`CREATE TABLE "mail_raw" (
			"id" uuid NOT NULL, "objectKey" varchar(128) NOT NULL, "sha256" varchar(64) NOT NULL,
			"size" integer NOT NULL, "createdAt" timestamptz NOT NULL, "state" varchar(16) NOT NULL,
			CONSTRAINT "PK_mail_raw" PRIMARY KEY ("id")
		)`);
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_mail_raw_objectKey" ON "mail_raw" ("objectKey")');
		await queryRunner.query(`CREATE TABLE "mail_delivery" (
			"id" uuid NOT NULL, "deliveryId" varchar(200) NOT NULL, "recipient" varchar(320) NOT NULL,
			"envelopeFrom" varchar(320) NOT NULL, "userId" varchar(32) NOT NULL, "rawId" uuid,
			"sha256" varchar(64) NOT NULL, "size" integer NOT NULL, "createdAt" timestamptz NOT NULL,
			"readAt" timestamptz, "deletedAt" timestamptz, "parseState" varchar(16) NOT NULL, "parsed" jsonb,
			CONSTRAINT "PK_mail_delivery" PRIMARY KEY ("id"),
			CONSTRAINT "FK_mail_delivery_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
			CONSTRAINT "FK_mail_delivery_raw" FOREIGN KEY ("rawId") REFERENCES "mail_raw"("id") ON DELETE RESTRICT
		)`);
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_mail_delivery_retry" ON "mail_delivery" ("deliveryId", "recipient")');
		await queryRunner.query('CREATE INDEX "IDX_mail_delivery_owner" ON "mail_delivery" ("userId", "createdAt")');
		await queryRunner.query(`CREATE TABLE "mail_outbox" (
			"id" uuid NOT NULL, "deliveryId" uuid NOT NULL, "kind" varchar(16) NOT NULL, "createdAt" timestamptz NOT NULL,
			CONSTRAINT "PK_mail_outbox" PRIMARY KEY ("id"),
			CONSTRAINT "FK_mail_outbox_delivery" FOREIGN KEY ("deliveryId") REFERENCES "mail_delivery"("id") ON DELETE CASCADE
		)`);
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_mail_outbox_delivery" ON "mail_outbox" ("deliveryId", "kind")');
	}
	async down(queryRunner) {
		// Export/private-storage retention must be handled before rolling back mail data.
		await queryRunner.query('DROP TABLE "mail_outbox"');
		await queryRunner.query('DROP TABLE "mail_delivery"');
		await queryRunner.query('DROP TABLE "mail_raw"');
		await queryRunner.query('DROP TABLE "mail_account"');
	}
}
