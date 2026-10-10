/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ForkRepositoryDefaults1791626147062 {
    name = 'ForkRepositoryDefaults1791626147062'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET DEFAULT 'https://github.com/tamaina/misskey-a'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "feedbackUrl" SET DEFAULT 'https://github.com/tamaina/misskey-a/issues/new'`);
    }

    async down(queryRunner) {
        // Keep stored administrator URLs; rollback leaves both nullable fields without a default.
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "feedbackUrl" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" DROP DEFAULT`);
    }
}
