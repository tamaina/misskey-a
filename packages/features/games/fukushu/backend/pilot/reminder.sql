-- SPDX-FileCopyrightText: misskey-project
-- SPDX-License-Identifier: AGPL-3.0-only
-- Pilot schema installed only in the isolated integration test.
CREATE TABLE fukushu_reminder (
	"ownerId" varchar(32) PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
	"localTime" time NOT NULL,
	zone text NOT NULL,
	"nextAt" timestamptz,
	"lastClaimedAt" timestamptz,
	"lastClaimedDay" date
);
CREATE INDEX "IDX_fukushu_reminder_next" ON fukushu_reminder ("nextAt", "ownerId")
	WHERE "nextAt" IS NOT NULL;
