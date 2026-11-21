/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FukushuDeckHistoryIndex1794990000000 {
	name = 'FukushuDeckHistoryIndex1794990000000';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE fukushu_upstream_record ADD "historyDeck" varchar(64),
			ADD "historyQuestion" varchar(64), ADD "historyOrder" bigint, ADD "indexedReviews" integer`);
		await queryRunner.query(`CREATE INDEX "IDX_fukushu_pending_history" ON fukushu_upstream_record ("ownerId")
			WHERE store = 'reviewLogs' AND "historyDeck" IS NULL`);
		await queryRunner.query(`CREATE INDEX "IDX_fukushu_deck_history" ON fukushu_upstream_record
			("ownerId", "historyDeck", "historyOrder", key COLLATE "C") INCLUDE ("historyQuestion")
			WHERE store = 'reviewLogs' AND "historyDeck" IS NOT NULL`);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE fukushu_upstream_record DROP COLUMN "historyDeck", DROP COLUMN "historyQuestion",
			DROP COLUMN "historyOrder", DROP COLUMN "indexedReviews"`);
	}
}
