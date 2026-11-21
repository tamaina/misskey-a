/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChannelFederationFreeze1794697200000 {
	name = 'ChannelFederationFreeze1794697200000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "channel" ADD "isFederationFrozen" boolean NOT NULL DEFAULT false`);
		// The new federation capability is opt-in. Existing local Groups stay frozen
		// until an operator grants eligibility and explicitly lifts the freeze.
		await queryRunner.query(`UPDATE "channel" SET "isFederationFrozen" = true WHERE "host" IS NULL AND "isFederated" = true`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "isFederationFrozen"`);
	}
}
