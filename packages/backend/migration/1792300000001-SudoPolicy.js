/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class SudoPolicy1792300000001 {
	name = 'SudoPolicy1792300000001';
	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "browser_session" ADD "sudoGrantId" character varying(43)');
		await queryRunner.query('ALTER TABLE "browser_session" ADD "sudoPolicyStamp" character varying(64)');
		// Earlier versions never issued elevations. Discard any unbound reserved values.
		await queryRunner.query('UPDATE "browser_session" SET "sudoUntil" = NULL');
	}
	async down(queryRunner) {
		await queryRunner.query('UPDATE "browser_session" SET "sudoUntil" = NULL');
		await queryRunner.query('ALTER TABLE "browser_session" DROP COLUMN "sudoPolicyStamp"');
		await queryRunner.query('ALTER TABLE "browser_session" DROP COLUMN "sudoGrantId"');
	}
}
