/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ActivityPubMultipleKeys1791573319995 {
    name = 'ActivityPubMultipleKeys1791573319995'

    async up(queryRunner) {
        // Redundant relation uniques differ between old synchronized databases
        // and the complete migration history; userId already has a primary key.
        await queryRunner.query(`ALTER TABLE "user_keypair" ADD "ed25519PublicKey" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user_keypair" ADD "ed25519PrivateKey" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user_keypair" DROP CONSTRAINT IF EXISTS "REL_f4853eb41ab722fe05f81cedeb"`);
        await queryRunner.query(`ALTER TABLE "user_keypair" DROP CONSTRAINT IF EXISTS "UQ_f4853eb41ab722fe05f81cedeb6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_171e64971c780ebd23fae140bb"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT IF EXISTS "REL_10c146e4b39b443ede016f6736"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT IF EXISTS "UQ_10c146e4b39b443ede016f6736d"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "PK_10c146e4b39b443ede016f6736d"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "PK_171e64971c780ebd23fae140bba" PRIMARY KEY ("keyId")`);
        await queryRunner.query(`CREATE INDEX "IDX_10c146e4b39b443ede016f6736" ON "user_publickey" ("userId")`);
    }

    async down(queryRunner) {
        // The old schema permits one remote key per actor. Prefer its main key.
        // Secondary remote keys and local Ed25519 columns are lost on rollback;
        // existing local RSA public/private columns remain unchanged.
        await queryRunner.query(`DELETE FROM "user_publickey" WHERE "keyId" IN (
            SELECT "keyId" FROM (
                SELECT "keyId", ROW_NUMBER() OVER (
                    PARTITION BY "userId"
                    ORDER BY CASE WHEN "keyId" LIKE '%#main-key' THEN 0 ELSE 1 END, "keyId"
                ) AS "rowNumber" FROM "user_publickey"
            ) AS "rankedKeys" WHERE "rowNumber" > 1
        )`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10c146e4b39b443ede016f6736"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "PK_171e64971c780ebd23fae140bba"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "PK_10c146e4b39b443ede016f6736d" PRIMARY KEY ("userId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_171e64971c780ebd23fae140bb" ON "user_publickey" ("keyId")`);
        await queryRunner.query(`ALTER TABLE "user_keypair" DROP COLUMN "ed25519PrivateKey"`);
        await queryRunner.query(`ALTER TABLE "user_keypair" DROP COLUMN "ed25519PublicKey"`);
    }
}
