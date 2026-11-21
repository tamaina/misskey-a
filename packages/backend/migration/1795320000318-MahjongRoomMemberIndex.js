/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const concurrently = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class MahjongRoomMemberIndex1795320000318 {
	name = 'MahjongRoomMemberIndex1795320000318';
	transaction = concurrently ? false : undefined;

	async up(queryRunner) {
		if (concurrently) {
			// Interrupted concurrent builds leave an invalid index behind.
			const [index] = await queryRunner.query(`SELECT indisvalid
				FROM pg_index
				WHERE indexrelid = to_regclass('"IDX_mahjong_room_user_ids_gin"')
				AND indrelid = 'mahjong_room'::regclass`);
			if (index?.indisvalid) return;
			if (index) await queryRunner.query('DROP INDEX CONCURRENTLY "IDX_mahjong_room_user_ids_gin"');
		}
		await queryRunner.query(`CREATE INDEX ${concurrently ? 'CONCURRENTLY ' : ''}"IDX_mahjong_room_user_ids_gin" ON "mahjong_room" USING GIN ("userIds")`);
	}

	async down(queryRunner) {
		// TypeORM reverts inside a transaction in both 'all' and 'each' modes.
		await queryRunner.query('DROP INDEX "IDX_mahjong_room_user_ids_gin"');
	}
}
