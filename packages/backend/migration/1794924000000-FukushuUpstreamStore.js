/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FukushuUpstreamStore1794924000000 {
    name = 'FukushuUpstreamStore1794924000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE fukushu_upstream_record ("ownerId" varchar(32) NOT NULL CONSTRAINT "FK_fukushu_upstream_record_owner" REFERENCES "user"(id) ON DELETE CASCADE, store varchar(32) NOT NULL, key varchar(64) NOT NULL, data text NOT NULL, blob bytea, revision integer NOT NULL DEFAULT 0, position integer NOT NULL, "sourceHash" varchar(64) NOT NULL, CONSTRAINT "PK_fukushu_upstream_record" PRIMARY KEY ("ownerId", store, key))`);
        await queryRunner.query(`CREATE TABLE fukushu_operation_receipt ("ownerId" varchar(32) NOT NULL CONSTRAINT "FK_fukushu_operation_receipt_owner" REFERENCES "user"(id) ON DELETE CASCADE, id uuid NOT NULL, request text NOT NULL, result text NOT NULL, CONSTRAINT "PK_fukushu_operation_receipt" PRIMARY KEY ("ownerId", id))`);
        // Native writers already use this owner lock. Also guard direct inserts and their race with import.
        await queryRunner.query(`CREATE FUNCTION fukushu_reject_upstream_collision() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
            PERFORM pg_advisory_xact_lock(hashtext('fukushu:create:' || NEW."ownerId"));
            IF EXISTS (SELECT 1 FROM fukushu_upstream_record WHERE "ownerId" = NEW."ownerId" AND store = TG_ARGV[0] AND key = encode(sha256(convert_to(to_jsonb(NEW.id::text)::text, 'UTF8')), 'hex')) THEN
                RAISE EXCEPTION 'Fukushu source ID already exists' USING ERRCODE = '23505', CONSTRAINT = 'fukushu_source_collision';
            END IF;
            RETURN NEW;
        END $$`);
        for (const [table, store] of [['fukushu_deck', 'decks'], ['fukushu_question', 'questions'], ['fukushu_review_log', 'reviewLogs']]) {
            await queryRunner.query(`CREATE TRIGGER fukushu_source_collision BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION fukushu_reject_upstream_collision('${store}')`);
        }
    }
    async down(queryRunner) {
        for (const table of ['fukushu_deck', 'fukushu_question', 'fukushu_review_log']) await queryRunner.query(`DROP TRIGGER fukushu_source_collision ON ${table}`);
        await queryRunner.query('DROP FUNCTION fukushu_reject_upstream_collision()');
        await queryRunner.query('DROP TABLE fukushu_operation_receipt');
        await queryRunner.query('DROP TABLE fukushu_upstream_record');
    }
}
