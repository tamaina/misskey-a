/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class OidcIdentities1792300000000 {
	name = 'OidcIdentities1792300000000';
	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "oidc_provider" ("id" varchar(32) NOT NULL, "name" varchar(100) NOT NULL, "version" varchar(43) NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "issuer" varchar(2048) NOT NULL DEFAULT '', "clientId" varchar(2048) NOT NULL DEFAULT '', "clientSecret" text, CONSTRAINT "PK_oidc_provider" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "oidc_identity" ("id" varchar(32) NOT NULL, "userId" varchar(32) NOT NULL, "providerId" varchar(32) NOT NULL, "issuer" varchar(2048) NOT NULL, "subject" varchar(255) NOT NULL, "createdAt" timestamptz NOT NULL, CONSTRAINT "PK_oidc_identity" PRIMARY KEY ("id"), CONSTRAINT "FK_oidc_identity_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE, CONSTRAINT "FK_oidc_identity_provider" FOREIGN KEY ("providerId") REFERENCES "oidc_provider"("id") ON DELETE RESTRICT)`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_oidc_identity_issuer_subject" ON "oidc_identity" ("issuer", "subject")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_oidc_identity_user_provider" ON "oidc_identity" ("userId", "providerId")`);
	}
	async down(queryRunner) {
		if ((await queryRunner.query(`SELECT 1 FROM "oidc_identity" LIMIT 1`)).length || (await queryRunner.query(`SELECT 1 FROM "oidc_provider" WHERE "enabled" OR "clientSecret" IS NOT NULL LIMIT 1`)).length) throw new Error('Remove OIDC identities through authenticated management before rollback');
		await queryRunner.query(`DROP TABLE "oidc_identity"`);
		await queryRunner.query(`DROP TABLE "oidc_provider"`);
	}
}
