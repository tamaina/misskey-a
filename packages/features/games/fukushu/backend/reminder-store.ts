/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { DataSource, EntityManager } from 'typeorm';
import type { UpstreamRecords } from '../shared/upstream-records.schema.js';

interface Schedule {
	localTime: string;
	zone: string;
}
interface Pending extends Schedule {
	ownerId: string;
	nextAt: Date;
	lastClaimedAt: Date | null;
	lastClaimedDay: string | null;
}

async function slots(manager: EntityManager, schedule: Schedule, now: Date, last?: Pick<Pending, 'lastClaimedAt' | 'lastClaimedDay'>) {
	// Resolve each local calendar day independently, including 23/25-hour days.
	const [row] = await manager.query<{ today: Date; tomorrow: Date; alreadyClaimed: boolean }[]>(`
		WITH local AS (SELECT ($1::timestamptz AT TIME ZONE $2)::date AS day)
		SELECT (day + $3::time) AT TIME ZONE $2 AS today,
			((day + 1) + $3::time) AT TIME ZONE $2 AS tomorrow,
			COALESCE(GREATEST(($4::timestamptz AT TIME ZONE $2)::date, $5::date) >= day, false) AS "alreadyClaimed" FROM local
	`, [now, schedule.zone, schedule.localTime, last?.lastClaimedAt ?? null, last?.lastClaimedDay ?? null]);
	return row;
}

async function hasDueReview(manager: EntityManager, ownerId: string, now: Date): Promise<boolean> {
	const native = await manager.query(`
		SELECT 1 FROM fukushu_study_state s
		JOIN fukushu_question q ON q."ownerId" = s."ownerId" AND q.id = s."questionId" AND q."deckId" = s."deckId"
		JOIN fukushu_deck d ON d."ownerId" = s."ownerId" AND d.id = s."deckId"
		WHERE s."ownerId" = $1 AND d."archivedAt" IS NULL AND (q.data->>'enabled')::boolean
			AND NOT (s.data->>'suspended')::boolean AND (s.data#>>'{card,reps}')::numeric > 0
			AND (s.data#>>'{card,due}')::timestamptz <= $2
			AND (s.data->>'updatedAt')::timestamptz <= $2
			AND COALESCE((s.data#>>'{card,lastReview}')::timestamptz, '-infinity') <= $2
		LIMIT 1
	`, [ownerId, now]);
	if (native.length) return true;

	// The stored text preserves escaped NUL and unpaired surrogates. Read it in
	// bounded pages without coercing source records to PostgreSQL jsonb.
	let cursor = '';
	for (;;) {
		const rows = await manager.query<{ key: string; state: string; question: string }[]>(`
			SELECT s.key, s.data AS state, q.data AS question FROM fukushu_upstream_record s
			JOIN fukushu_upstream_record q ON q."ownerId" = s."ownerId" AND q.store = 'questions' AND q.key = s.key
			WHERE s."ownerId" = $1 AND s.store = 'studyStates' AND s.key > $2 ORDER BY s.key LIMIT 32
		`, [ownerId, cursor]);
		if (rows.some(row => {
			const state: UpstreamRecords['studyStates'][number] = JSON.parse(row.state);
			if (state.suspended || state.card.reps === 0 || new Date(state.card.due) > now) return false;
			const question: UpstreamRecords['questions'][number] = JSON.parse(row.question);
			return question.enabled && question.kind !== 'unsupported';
		})) return true;
		if (rows.length < 32) return false;
		cursor = rows[rows.length - 1].key;
	}
}

export class FukushuReminderStore {
	constructor(private readonly db: DataSource, private readonly clock = () => new Date()) {}

	async settings(ownerId: string): Promise<Schedule | null> {
		const rows = await this.db.query<Schedule[]>(`SELECT to_char("localTime", 'HH24:MI') AS "localTime", zone FROM fukushu_reminder WHERE "ownerId" = $1 AND "nextAt" IS NOT NULL`, [ownerId]);
		return rows[0] ?? null;
	}

	async configure(ownerId: string, schedule: Schedule | null): Promise<void> {
		if (!schedule) {
			// Preserve the claim across opt-out / opt-in on the same day.
			await this.db.query('UPDATE fukushu_reminder SET "nextAt" = NULL, "retryAt" = NULL, "expiresAt" = NULL WHERE "ownerId" = $1', [ownerId]);
			return;
		}
		if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(schedule.localTime)) throw new RangeError('Invalid reminder time');
		if (!/^[A-Za-z][A-Za-z0-9_+/-]*$/.test(schedule.zone)) throw new RangeError('Invalid time zone');
		const zone = new Intl.DateTimeFormat('en', { timeZone: schedule.zone }).resolvedOptions().timeZone;
		await this.db.transaction(async manager => {
			const now = this.clock();
			const { today, tomorrow } = await slots(manager, { ...schedule, zone }, now);
			await manager.query(`
				INSERT INTO fukushu_reminder ("ownerId", "localTime", zone, "nextAt") VALUES ($1, $2, $3, $4)
				ON CONFLICT ("ownerId") DO UPDATE SET "localTime" = EXCLUDED."localTime",
					zone = EXCLUDED.zone, "nextAt" = EXCLUDED."nextAt", "retryAt" = NULL, "expiresAt" = NULL
				WHERE fukushu_reminder."nextAt" IS NULL OR fukushu_reminder.zone <> EXCLUDED.zone
					OR fukushu_reminder."localTime" <> EXCLUDED."localTime"
			`, [ownerId, schedule.localTime, zone, today >= now ? today : tomorrow]);
		});
	}

	/** undefined = no pending schedule, null = checked but no push, string = recipient only. */
	async claimNext(): Promise<string | null | undefined> {
		return this.db.transaction('READ COMMITTED', async manager => {
			const now = this.clock();
			const pending = await manager.query<Pending[]>(`
				SELECT * FROM fukushu_reminder WHERE "nextAt" <= $1
				ORDER BY "nextAt", "ownerId" LIMIT 1 FOR UPDATE SKIP LOCKED
			`, [now]);
			if (!pending.length) return undefined;
			const row = pending[0];
			const { today, tomorrow, alreadyClaimed } = await slots(manager, row, now, row);
			const elapsed = now.getTime() - today.getTime();
			const eligible = elapsed >= 0 && elapsed < 60 * 60_000 && row.nextAt <= today
				&& !alreadyClaimed;
			const send = eligible && await hasDueReview(manager, row.ownerId, now);
			await manager.query(`
				UPDATE fukushu_reminder SET "nextAt" = $2,
					"retryAt" = CASE WHEN $3 THEN $4::timestamptz END,
					"expiresAt" = CASE WHEN $3 THEN $5::timestamptz END,
					"lastClaimedAt" = CASE WHEN $3 THEN $4::timestamptz ELSE "lastClaimedAt" END,
					"lastClaimedDay" = CASE WHEN $3 THEN ($4::timestamptz AT TIME ZONE zone)::date ELSE "lastClaimedDay" END
				WHERE "ownerId" = $1
			`, [row.ownerId, today > now ? today : tomorrow, send, now, new Date(today.getTime() + 3600_000)]);
			return send ? row.ownerId : null;
		});
	}

	/** Reserve before network I/O. A crashed worker's reservation becomes eligible again. */
	async deliverNext(send: (ownerId: string, body: { occurrence: number; expiresAt: number }) => Promise<boolean>): Promise<boolean> {
		const row = await this.db.transaction(async manager => {
			const now = this.clock();
			const rows = await manager.query<{ ownerId: string; expiresAt: Date; lastClaimedAt: Date }[]>(`
				SELECT "ownerId", "expiresAt", "lastClaimedAt" FROM fukushu_reminder
				WHERE "retryAt" <= $1 ORDER BY "retryAt", "ownerId" LIMIT 1 FOR UPDATE SKIP LOCKED
			`, [now]);
			if (!rows.length) return undefined;
			const candidate = rows[0];
			if (candidate.expiresAt <= now || !await hasDueReview(manager, candidate.ownerId, now)) {
				await manager.query('UPDATE fukushu_reminder SET "retryAt" = NULL, "expiresAt" = NULL WHERE "ownerId" = $1', [candidate.ownerId]);
				return null;
			}
			await manager.query('UPDATE fukushu_reminder SET "retryAt" = $2 WHERE "ownerId" = $1', [candidate.ownerId, new Date(now.getTime() + 5 * 60_000)]);
			return candidate;
		});
		if (row === undefined) return false;
		if (row !== null) {
			const delivered = await send(row.ownerId, { occurrence: row.lastClaimedAt.getTime(), expiresAt: row.expiresAt.getTime() });
			if (!delivered) return true;
			await this.db.query('UPDATE fukushu_reminder SET "retryAt" = NULL, "expiresAt" = NULL WHERE "ownerId" = $1 AND "lastClaimedAt" = $2', [row.ownerId, row.lastClaimedAt]);
		}
		return true;
	}
}
