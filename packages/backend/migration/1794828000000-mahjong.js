/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Mahjong1794828000000 {
    name = 'Mahjong1794828000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "mahjong_room" ("id" uuid NOT NULL, "ownerId" character varying(32) NOT NULL, "userIds" character varying[] NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying(16) NOT NULL, "state" jsonb NOT NULL, CONSTRAINT "PK_mahjong_room" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_mahjong_room_owner" ON "mahjong_room" ("ownerId")`);
        await queryRunner.query(`ALTER TABLE "mahjong_room" ADD CONSTRAINT "FK_mahjong_room_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "mahjong_room"`);
    }
}
