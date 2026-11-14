/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomUUID } from 'node:crypto';
import { parseEnvelopeRecipient } from './ingress.js';
import type { DataSource } from 'typeorm';

export interface PrivateMailStorage {
	put(key: string, raw: Uint8Array): Promise<void>;
	get(key: string): Promise<Uint8Array>;
	delete(key: string): Promise<void>;
}
export type StoredMail = { id: string; objectKey: string; sha256: string; size: number; state: string };
export class MailStoreError extends Error {
	constructor(public readonly code: 'RECIPIENT_UNAVAILABLE' | 'QUOTA_EXCEEDED' | 'RETRY_CONFLICT' | 'NOT_FOUND' | 'RAW_UNAVAILABLE') { super(code); }
}

/**
 * Durable foundation, deliberately not an Internet SMTP server. Call only after
 * authenticating the MTA envelope. The caller sends success AFTER accept resolves.
 */
export class MailStore {
	constructor(
		private readonly db: DataSource,
		private readonly storage: PrivateMailStorage,
		private readonly domain: string,
		private readonly quotaBytes: bigint,
		private readonly maxBytes = 25 * 1024 * 1024,
		private readonly spoolBytes = 1024n * 1024n * 1024n,
		private readonly forwardingEnabled = false,
	) {
		if (quotaBytes < 0n || spoolBytes < 0n || !Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid mail limits');
		parseEnvelopeRecipient(`mailbox@${domain}`, domain);
	}

	/** Opt-in only; exposed by a future authenticated, policy-checked settings API. */
	async setEnabled(userId: string, enabled: boolean): Promise<void> {
		await this.db.query(`INSERT INTO "mail_account" ("userId", "enabled") VALUES ($1, $2)
			ON CONFLICT ("userId") DO UPDATE SET "enabled" = EXCLUDED."enabled"`, [userId, enabled]);
	}

	async resolveRecipient(address: string): Promise<{ userId: string; recipient: string; suffix: string | null }> {
		const parsed = parseEnvelopeRecipient(address, this.domain);
		// Operational aliases and bounce/SRS domains stay at the MTA, not user inboxes.
		if (['postmaster', 'abuse', 'mailer_daemon', 'bounce', 'bounces'].includes(parsed.username)) throw new MailStoreError('RECIPIENT_UNAVAILABLE');
		const rows = await this.db.query(`SELECT u."id" FROM "user" u JOIN "mail_account" m ON m."userId" = u."id"
			WHERE u."usernameLower" = $1 AND u."host" IS NULL AND NOT u."isSuspended" AND NOT u."isDeleted" AND m."enabled"`, [parsed.username]);
		if (rows.length !== 1) throw new MailStoreError('RECIPIENT_UNAVAILABLE');
		return { userId: rows[0].id, recipient: parsed.address, suffix: parsed.suffix };
	}

	/** Staging row makes failed uploads/crashes discoverable without bucket listing. */
	async stage(raw: Uint8Array): Promise<StoredMail> {
		if (raw.byteLength < 1 || raw.byteLength > this.maxBytes) throw new Error('Mail size out of bounds');
		const bytes = Buffer.from(raw);
		const item = { id: randomUUID(), objectKey: `raw/${randomUUID()}.eml`, sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.byteLength, state: 'staging' };
		await this.db.transaction(async manager => {
			// Separate physical raw/spool budget, including failed and retry uploads.
			await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'mail:spool\', 0))');
			const [usage] = await manager.query('SELECT COALESCE(SUM("size"), 0)::text AS bytes FROM "mail_raw"');
			if (BigInt(usage.bytes) + BigInt(item.size) > this.spoolBytes) throw new MailStoreError('QUOTA_EXCEEDED');
			await manager.query('INSERT INTO "mail_raw" ("id", "objectKey", "sha256", "size", "createdAt", "state") VALUES ($1,$2,$3,$4,now(),\'staging\')', [item.id, item.objectKey, item.sha256, item.size]);
		});
		await this.db.transaction(async manager => {
			// Hold the same row lock as collection through upload/finalization. A slow
			// upload cannot recreate an object after the collector has removed its row.
			const [current] = await manager.query('SELECT "state" FROM "mail_raw" WHERE "id"=$1 FOR UPDATE', [item.id]);
			if (current?.state !== 'staging') throw new MailStoreError('RAW_UNAVAILABLE');
			await this.storage.put(item.objectKey, bytes);
			await manager.query('UPDATE "mail_raw" SET "state" = \'ready\' WHERE "id" = $1', [item.id]);
		});
		return { ...item, state: 'ready' };
	}

	/** Per-recipient LMTP acceptance. Partial failures never undo other recipients. */
	async accept(rawId: string, deliveryId: string, address: string, envelopeFrom: string): Promise<{ id: string; duplicate: boolean }> {
		if (!/^[A-Za-z0-9_-]{16,128}$/.test(deliveryId) || envelopeFrom.length > 254 || /[\r\n\0]/.test(envelopeFrom)) throw new Error('Invalid MTA envelope');
		const recipient = await this.resolveRecipient(address);
		return this.db.transaction(async manager => {
			// Order: retry identity -> raw -> account/user. All paths use this order.
			await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`mail:${deliveryId}:${recipient.recipient}`]);
			const [raw] = await manager.query('SELECT * FROM "mail_raw" WHERE "id"=$1 FOR UPDATE', [rawId]) as (StoredMail | undefined)[];
			if (!raw || raw.state !== 'ready') throw new MailStoreError('RAW_UNAVAILABLE');
			const [previous] = await manager.query('SELECT * FROM "mail_delivery" WHERE "deliveryId"=$1 AND "recipient"=$2', [deliveryId, recipient.recipient]);
			if (previous) {
				if (previous.userId !== recipient.userId || previous.sha256 !== raw.sha256 || previous.envelopeFrom !== envelopeFrom) throw new MailStoreError('RETRY_CONFLICT');
				return { id: previous.id, duplicate: true };
			}
			const [account] = await manager.query(`SELECT m."usedBytes" FROM "mail_account" m JOIN "user" u ON u."id"=m."userId"
				WHERE m."userId"=$1 AND u."usernameLower"=$2 AND m."enabled" AND u."host" IS NULL AND NOT u."isDeleted" AND NOT u."isSuspended" FOR UPDATE OF m, u`, [recipient.userId, parseEnvelopeRecipient(address, this.domain).username]);
			if (!account) throw new MailStoreError('RECIPIENT_UNAVAILABLE');
			const [forwarding] = this.forwardingEnabled ? await manager.query('SELECT * FROM "mail_forwarding" WHERE "userId"=$1 AND "enabled" AND "verifiedAt" IS NOT NULL AND "address" IS NOT NULL FOR SHARE', [recipient.userId]) : [];
			const quotaExceeded = BigInt(account.usedBytes) + BigInt(raw.size) > this.quotaBytes;
			const localStored = (!forwarding || forwarding.keepLocalCopy) && !quotaExceeded;
			if (!localStored && !forwarding) throw new MailStoreError('QUOTA_EXCEEDED');
			const localError = localStored ? null : (quotaExceeded && (!forwarding || forwarding.keepLocalCopy) ? 'quota' : 'disabled');
			const id = randomUUID();
			await manager.query(`INSERT INTO "mail_delivery" ("id","deliveryId","recipient","envelopeFrom","userId","rawId","sha256","size","createdAt","parseState","localStored","localError")
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),$9,$10,$11)`, [id, deliveryId, recipient.recipient, envelopeFrom, recipient.userId, localStored ? rawId : null, raw.sha256, raw.size, localStored ? 'pending' : 'parsed', localStored, localError]);
			if (localStored) {
				await manager.query('UPDATE "mail_account" SET "usedBytes"="usedBytes"+$2 WHERE "userId"=$1', [recipient.userId, raw.size]);
				await manager.query(`INSERT INTO "mail_outbox" ("id","deliveryId","kind","createdAt") VALUES ($1,$2,'parse',now())`, [randomUUID(), id]);
			}
			if (forwarding) {
				await manager.query(`INSERT INTO "mail_submission" ("id","userId","idempotencyKey","contentHash","rawId","kind","deliveryId","forwardingRevision","envelopeFrom","recipients","metadata","state","createdAt","expiresAt","nextAttemptAt","size")
					VALUES ($1,$2,$3,$4,$5,'forward',$6,$7,$8,$9,$10,'queued',now(),now()+interval '1 day',now(),$11)`,
				[randomUUID(), recipient.userId, `forward:${id}:${forwarding.revision}`, raw.sha256, rawId, id, forwarding.revision, envelopeFrom, JSON.stringify([forwarding.address]), JSON.stringify({ subject: '', to: [forwarding.address], cc: [], bcc: [] }), raw.size]);
			}
			return { id, duplicate: false };
		});
	}

	/** Never return other recipients or shared raw metadata to an API caller. */
	async readRaw(userId: string, id: string): Promise<Uint8Array> {
		const [row] = await this.db.query(`SELECT r."objectKey" FROM "mail_delivery" d JOIN "mail_raw" r ON r."id"=d."rawId"
			WHERE d."id"=$1 AND d."userId"=$2 AND d."deletedAt" IS NULL AND d."localStored" AND r."state"='ready'`, [id, userId]);
		if (!row) throw new MailStoreError('NOT_FOUND');
		return this.storage.get(row.objectKey);
	}

	/** Atomic, owner-scoped, idempotent deletion and quota decrement. */
	async remove(userId: string, id: string): Promise<void> {
		await this.db.transaction(async manager => {
			const [row] = await manager.query('SELECT * FROM "mail_delivery" WHERE "id"=$1 AND "userId"=$2 FOR UPDATE', [id, userId]);
			if (!row) throw new MailStoreError('NOT_FOUND');
			if (row.deletedAt) return;
			if (row.localStored) await manager.query('UPDATE "mail_account" SET "usedBytes"="usedBytes"-$2 WHERE "userId"=$1', [userId, row.size]);
			await manager.query('DELETE FROM "mail_outbox" WHERE "deliveryId"=$1', [id]);
			await manager.query('UPDATE "mail_delivery" SET "deletedAt"=now(), "rawId"=NULL, "parsed"=NULL WHERE "id"=$1', [id]);
		});
	}

	/** Keep DB outbox rows until the worker commits its result, not just Redis enqueue. */
	async dispatch(enqueue: (id: string) => Promise<void>, limit = 100): Promise<number> {
		if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error('Invalid outbox limit');
		const rows = await this.db.query('SELECT "deliveryId" FROM "mail_outbox" ORDER BY "createdAt" LIMIT $1', [limit]);
		for (const row of rows) await enqueue(row.deliveryId);
		return rows.length;
	}

	/** Parsing is safe to repeat: last successful DB commit removes the outbox. */
	async completeParse(id: string, parsed: Record<string, unknown> | null): Promise<void> {
		// Store only a bounded text/metadata projection. Attachment bytes stay in raw.
		if (parsed !== null) {
			const json = JSON.stringify(parsed, (_key, value) => {
				if (value instanceof Uint8Array || value instanceof ArrayBuffer || value?.type === 'Buffer') throw new Error('Attachment bytes must not be stored as JSON');
				return value;
			});
			if (Buffer.byteLength(json) > 1024 * 1024) throw new Error('Mail projection too large');
		}
		await this.db.transaction(async manager => {
			await manager.query('UPDATE "mail_delivery" SET "parseState"=$2, "parsed"=$3 WHERE "id"=$1 AND "deletedAt" IS NULL AND "parseState"=\'pending\'', [id, parsed === null ? 'failed' : 'parsed', parsed]);
			await manager.query('DELETE FROM "mail_outbox" WHERE "deliveryId"=$1', [id]);
		});
	}

	/** Claim before object deletion; new accepts cannot reference deleting objects. */
	async collect(limit = 100): Promise<number> {
		if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error('Invalid collection limit');
		const candidates = await this.db.query(`SELECT "id" FROM "mail_raw" r WHERE (r."state"='deleting' OR r."createdAt" < now()-interval '1 day')
			AND NOT EXISTS (SELECT 1 FROM "mail_delivery" d WHERE d."rawId"=r."id")
			AND NOT EXISTS (SELECT 1 FROM "mail_submission" s WHERE s."rawId"=r."id") LIMIT $1`, [limit]);
		let count = 0;
		for (const candidate of candidates) {
			const key = await this.db.transaction(async manager => {
				const [row] = await manager.query('SELECT * FROM "mail_raw" WHERE "id"=$1 FOR UPDATE', [candidate.id]);
				if (!row) return null;
				const refs = await manager.query('SELECT 1 FROM "mail_delivery" WHERE "rawId"=$1 UNION ALL SELECT 1 FROM "mail_submission" WHERE "rawId"=$1 LIMIT 1', [candidate.id]);
				if (refs.length) return null;
				await manager.query('UPDATE "mail_raw" SET "state"=\'deleting\' WHERE "id"=$1', [candidate.id]);
				return row.objectKey as string;
			});
			if (!key) continue;
			await this.storage.delete(key);
			await this.db.query('DELETE FROM "mail_raw" WHERE "id"=$1 AND "state"=\'deleting\'', [candidate.id]);
			count++;
		}
		return count;
	}
}
