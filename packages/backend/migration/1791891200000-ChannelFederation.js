/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChannelFederation1791891200000 {
	name = 'ChannelFederation1791891200000';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "channel" ADD "isFederated" boolean NOT NULL DEFAULT false, ADD "uri" character varying(512), ADD "host" character varying(128), ADD "federationPrivateKey" text, ADD "federationPublicKey" text`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_channel_uri" ON "channel" ("uri")`);
	}
	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_channel_uri"`);
		await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "federationPublicKey", DROP COLUMN "federationPrivateKey", DROP COLUMN "host", DROP COLUMN "uri", DROP COLUMN "isFederated"`);
	}
}
