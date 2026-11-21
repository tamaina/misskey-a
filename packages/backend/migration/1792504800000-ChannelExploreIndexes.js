/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const concurrent = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class ChannelExploreIndexes1792504800000 {
	name = 'ChannelExploreIndexes1792504800000';
	transaction = concurrent ? false : undefined;

	async createIndex(queryRunner, name, definition) {
		if (concurrent) {
			// A concurrent migration can stop after creating some indexes, or leave an
			// invalid index behind. Resume only after checking that index's validity.
			const rows = await queryRunner.query('SELECT indisvalid FROM pg_index WHERE indexrelid = to_regclass($1)', [`"${name}"`]);
			if (rows[0]?.indisvalid === true) return;
			if (rows.length > 0) await queryRunner.query(`DROP INDEX CONCURRENTLY "${name}"`);
		}
		await queryRunner.query(`CREATE INDEX${concurrent ? ' CONCURRENTLY' : ''} "${name}" ON "channel" ${definition}`);
	}

	async up(queryRunner) {
		await this.createIndex(queryRunner, 'IDX_channel_active_local_id', '("id") WHERE "isArchived" = false AND "host" IS NULL');
		await this.createIndex(queryRunner, 'IDX_channel_active_remote_id', '("id") WHERE "isArchived" = false AND "host" IS NOT NULL');
		await this.createIndex(queryRunner, 'IDX_channel_active_local_activity', '("lastNotedAt", "id") WHERE "isArchived" = false AND "host" IS NULL AND "lastNotedAt" IS NOT NULL');
		await this.createIndex(queryRunner, 'IDX_channel_active_remote_activity', '("lastNotedAt", "id") WHERE "isArchived" = false AND "host" IS NOT NULL AND "lastNotedAt" IS NOT NULL');
	}

	async down(queryRunner) {
		const mode = concurrent ? ' CONCURRENTLY IF EXISTS' : '';
		for (const name of ['IDX_channel_active_remote_activity', 'IDX_channel_active_local_activity', 'IDX_channel_active_remote_id', 'IDX_channel_active_local_id']) {
			await queryRunner.query(`DROP INDEX${mode} "${name}"`);
		}
	}
}
