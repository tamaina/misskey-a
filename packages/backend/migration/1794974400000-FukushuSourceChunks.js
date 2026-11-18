/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FukushuSourceChunks1794974400000 {
	name = 'FukushuSourceChunks1794974400000';
	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE fukushu_upstream_record ADD COLUMN "chunkedSize" integer');
		await queryRunner.query('CREATE TABLE fukushu_upstream_chunk ("ownerId" varchar(32) NOT NULL, store varchar(32) NOT NULL, key varchar(64) NOT NULL, part integer NOT NULL, bytes bytea NOT NULL, CONSTRAINT "PK_fukushu_upstream_chunk" PRIMARY KEY ("ownerId", store, key, part), CONSTRAINT "FK_fukushu_upstream_chunk_record" FOREIGN KEY ("ownerId", store, key) REFERENCES fukushu_upstream_record ("ownerId", store, key) ON DELETE CASCADE)');
		await queryRunner.query('CREATE TABLE fukushu_source_usage ("ownerId" varchar(32) NOT NULL CONSTRAINT "FK_fukushu_source_usage_owner" REFERENCES "user"(id) ON DELETE CASCADE, count integer NOT NULL, logs integer NOT NULL, last integer NOT NULL, bytes integer NOT NULL, binaries integer NOT NULL, CONSTRAINT "PK_fukushu_source_usage" PRIMARY KEY ("ownerId"))');
		await queryRunner.query(`INSERT INTO fukushu_source_usage ("ownerId", count, last, logs, bytes, binaries)
			SELECT "ownerId", COUNT(*)::int, MAX(position),
				COUNT(*) FILTER (WHERE store = 'reviewLogs')::int,
				SUM(octet_length(data) + octet_length(store) + 21
					+ CASE WHEN size IS NULL THEN 0 ELSE 12 + length(size::text) END)::int,
				SUM(COALESCE(size, 0))::int
			FROM (
				SELECT "ownerId", position, store, data, COALESCE("chunkedSize", octet_length(blob)) AS size
				FROM fukushu_upstream_record
			) records GROUP BY "ownerId"`);
	}
	async down(queryRunner) {
		const [used] = await queryRunner.query(`SELECT EXISTS (
			SELECT 1 FROM fukushu_source_usage WHERE bytes + binaries + count * 4 + 81 > 8388608
			UNION ALL SELECT 1 FROM fukushu_upstream_record WHERE store IN ('questions', 'studyStates')
				GROUP BY "ownerId", store HAVING COUNT(*) > 1000
		) AS used`);
		if (used.used) throw new Error('Export and migrate collections above legacy reader limits before reverting');
		await queryRunner.query('DROP TABLE fukushu_source_usage');
		await queryRunner.query('DROP TABLE fukushu_upstream_chunk');
		await queryRunner.query('ALTER TABLE fukushu_upstream_record DROP COLUMN "chunkedSize"');
	}
}
