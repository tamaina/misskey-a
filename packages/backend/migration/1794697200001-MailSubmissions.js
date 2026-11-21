/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MailSubmissions1794697200001 {
	name = 'MailSubmissions1794697200001';
	async up(q) {
		await q.query(`ALTER TABLE "mail_delivery" ADD "localStored" boolean NOT NULL DEFAULT true, ADD "localError" varchar(16)`);
		await q.query(`CREATE TABLE "mail_forwarding" (
			"userId" varchar(32) NOT NULL, "address" varchar(254), "enabled" boolean NOT NULL DEFAULT false,
			"keepLocalCopy" boolean NOT NULL DEFAULT true, "revision" integer NOT NULL DEFAULT 0,
			"verifiedAt" timestamptz, "tokenHash" varchar(64), "expiresAt" timestamptz, "updatedAt" timestamptz NOT NULL,
			CONSTRAINT "PK_mail_forwarding" PRIMARY KEY ("userId"),
			CONSTRAINT "FK_mail_forwarding_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
		)`);
		await q.query(`CREATE TABLE "mail_submission" (
			"id" uuid NOT NULL, "userId" varchar(32) NOT NULL, "idempotencyKey" varchar(200) NOT NULL,
			"contentHash" varchar(64) NOT NULL, "rawId" uuid, "kind" varchar(16) NOT NULL, "deliveryId" uuid,
			"forwardingRevision" integer, "envelopeFrom" varchar(254) NOT NULL, "recipients" jsonb NOT NULL,
			"metadata" jsonb NOT NULL, "state" varchar(16) NOT NULL, "attemptId" uuid, "leaseUntil" timestamptz,
			"createdAt" timestamptz NOT NULL, "expiresAt" timestamptz NOT NULL, "nextAttemptAt" timestamptz NOT NULL,
			"attempts" integer NOT NULL DEFAULT 0, "size" integer NOT NULL, "charged" boolean NOT NULL DEFAULT false,
			"deletedAt" timestamptz, "result" jsonb NOT NULL DEFAULT '{}',
			CONSTRAINT "PK_mail_submission" PRIMARY KEY ("id"),
			CONSTRAINT "FK_mail_submission_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
			CONSTRAINT "FK_mail_submission_raw" FOREIGN KEY ("rawId") REFERENCES "mail_raw"("id") ON DELETE RESTRICT
		)`);
		await q.query('CREATE UNIQUE INDEX "IDX_mail_submission_key" ON "mail_submission" ("userId", "idempotencyKey")');
		await q.query('CREATE INDEX "IDX_mail_submission_due" ON "mail_submission" ("state", "nextAttemptAt")');
	}
	async down(q) {
		await q.query('DROP TABLE "mail_submission"');
		await q.query('DROP TABLE "mail_forwarding"');
		await q.query('ALTER TABLE "mail_delivery" DROP COLUMN "localError", DROP COLUMN "localStored"');
	}
}
