/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FukushuMaterialBytes1794980000000 {
	name = 'FukushuMaterialBytes1794980000000';
	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE fukushu_source_usage ADD COLUMN "materialBytes" integer');
		await queryRunner.query(`UPDATE fukushu_source_usage u SET "materialBytes" = u.bytes - COALESCE((
			SELECT SUM(octet_length(r.data) + octet_length(r.store) + 21)
			FROM fukushu_upstream_record r WHERE r."ownerId" = u."ownerId" AND r.store = 'reviewLogs'
		), 0)`);
		await queryRunner.query('ALTER TABLE fukushu_source_usage ALTER COLUMN "materialBytes" SET NOT NULL');
	}
	async down(queryRunner) {
		const [large] = await queryRunner.query('SELECT 1 FROM fukushu_source_usage WHERE bytes > 8388608 LIMIT 1');
		if (large) throw new Error('The previous reader cannot restore this collection');
		await queryRunner.query('ALTER TABLE fukushu_source_usage DROP COLUMN "materialBytes"');
	}
}
