/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { In, QueryFailedError } from 'typeorm';
import * as v from 'valibot';
import { scanSourceArchive, MAX_SOURCE_ARCHIVE_BYTES, MAX_SOURCE_JSON_BYTES } from '../shared/source-scan.js';
import { checkMaterialCount, checkUpstreamRelations, emptyUpstreamRecords, UPSTREAM_MAGIC } from '../shared/upstream-reader.js';
import { upstreamStoreSchemas } from '../shared/upstream-records.schema.js';
import { studyRequestIdSchema } from '../shared/study.schema.js';
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { planGiftUpdate } from './gift-update.js';
import { BackupError } from './backup-codec.js';
import { MaterialError } from './store.js';
import { StudyError } from './study-store.js';
import { applyUpstreamReview, CompatibilitySessionError } from './pilot/upstream-session.js';
import { MiFukushuUpstreamRecord } from './models/FukushuUpstreamRecord.js';
import { MiFukushuSourceUsage } from './models/FukushuSourceUsage.js';
import { MiFukushuOperationReceipt } from './models/FukushuOperationReceipt.js';
import { MiFukushuUpstreamChunk } from './models/FukushuUpstreamChunk.js';
import type { DataSource, EntityManager } from 'typeorm';
import type { UpstreamFrame } from '../shared/upstream-reader.js';
import type { SourceHistoryPage } from './upstream.contract.js';
import type { SourceFrameOffset } from '../shared/source-scan.js';
import type { DriveSnapshot, WithSource } from './backup-drive.js';
import type { CompatibilityReviewInput } from './pilot/upstream-session.js';

const materialStores = Object.keys(upstreamStoreSchemas).filter(store => store !== 'reviewLogs');
const SOURCE_CHUNK_BYTES = 256 * 1024;
const hash = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
const key = (value: unknown) => hash(JSON.stringify(value));
export type PersistedUpstreamReview = Omit<CompatibilityReviewInput, 'reviewedAt'>;

export class FukushuUpstreamStore {
	constructor(private readonly db: DataSource, private readonly reader: { withSource: WithSource }, private readonly clock: () => Date = () => new Date()) {}

	private async lock(manager: EntityManager, ownerId: string) {
		await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
	}

	private async receipt(manager: EntityManager, ownerId: string, id: string, request: string) {
		const row = await manager.getRepository(MiFukushuOperationReceipt).findOneBy({ ownerId, id });
		if (row && row.request !== request) throw new StudyError('STUDY_CONFLICT');
		return row ? JSON.parse(row.result) : undefined;
	}

	async restored(ownerId: string, fileId: string, requestId: string): Promise<boolean> {
		return Boolean(await this.receipt(this.db.manager, ownerId, requestId, JSON.stringify({ operation: 'restore', fileId })));
	}

	async restore(ownerId: string, fileId: string, requestId: string, accepted?: { size: number; md5: string }): Promise<{ restored: true; sha256: string; records: number }> {
		const id = v.parse(studyRequestIdSchema, requestId);
		const request = JSON.stringify({ operation: 'restore', fileId });
		const prior = await this.receipt(this.db.manager, ownerId, id, request);
		if (prior) return prior;
		return this.reader.withSource(ownerId, fileId, async snapshot => {
			if (!accepted && snapshot.blob.size > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
			if (accepted && (snapshot.blob.size !== accepted.size || snapshot.md5 !== accepted.md5)) throw new BackupError('BACKUP_FAILED');
			const frames: SourceFrameOffset[] = [];
			await scanSourceArchive(snapshot.blob, undefined, frame => frames.push(frame));
			return this.commitRestore(ownerId, fileId, id, request, snapshot, frames);
		}, accepted ? MAX_SOURCE_ARCHIVE_BYTES : MAX_BACKUP_BYTES);
	}

	private async commitRestore(ownerId: string, fileId: string, id: string, request: string, snapshot: DriveSnapshot, frames: SourceFrameOffset[]) {
		try {
			return await this.db.transaction(async manager => {
				await this.lock(manager, ownerId);
				const previous = await this.receipt(manager, ownerId, id, request);
				if (previous) return previous;
				const files = await manager.query('SELECT "userId", "userHost", uri, "isLink", size, md5 FROM drive_file WHERE id = $1 AND "userId" = $2 FOR SHARE', [fileId, ownerId]);
				const file = files[0];
				if (!file) throw new MaterialError('NO_SUCH_FILE');
				if (file.userHost !== null || file.uri !== null || file.isLink || file.size !== snapshot.blob.size || file.md5 !== snapshot.md5) throw new BackupError('BACKUP_FAILED');
				const records = manager.getRepository(MiFukushuUpstreamRecord);
				const deckCounts = new Map<string, number>();
				// The owner/store/key primary key rejects any source collision in the same transaction.
				// Keep the validated metadata bounded, reread each binary from the immutable snapshot.
				// A batch never accumulates binary buffers, even for many small media.
				for (let index = 0; index < frames.length;) {
					const first = frames[index];
					let end = index + 1;
					while (end < frames.length && end - index < 100 && frames[end].start + frames[end].length - first.start <= SOURCE_CHUNK_BYTES) end++;
					const offsets = frames.slice(index, end);
					const last = frames[end - 1];
					const bytes = Buffer.from(await snapshot.blob.slice(first.start, last.start + last.length).arrayBuffer());
					const batch = offsets.map(frame => {
						const offset = frame.start - first.start;
						const { store, value }: UpstreamFrame = JSON.parse(bytes.toString('utf8', offset, offset + frame.length));
						return { store, value, blobSize: frame.blobSize, blobOffset: frame.start + frame.length };
					});
					// Native PostgreSQL text IDs cannot contain NUL or unpaired surrogates.
					// Preserve these in the source JSON; they have no possible native collision.
					for (const [table, store] of [['fukushu_deck', 'decks'], ['fukushu_question', 'questions'], ['fukushu_review_log', 'reviewLogs']]) {
						const ids = batch.filter(frame => frame.store === store).map(frame => frame.value.id)
							.filter((value): value is string => typeof value === 'string' && !value.includes('\0') && value.isWellFormed());
						if (!ids.length) continue;
						const conflict = await manager.query(`SELECT 1 FROM ${table} WHERE "ownerId" = $1 AND id::text = ANY($2::text[]) LIMIT 1`, [ownerId, ids]);
						if (conflict.length) throw new BackupError('BACKUP_CONFLICT');
					}
					const rows = batch.map((frame, i) => {
						const lookup = frame.store === 'reviewLogs' ? this.historyFields(frame.value) : undefined;
						if (lookup) deckCounts.set(lookup.historyDeck, (deckCounts.get(lookup.historyDeck) ?? 0) + 1);
						return {
							...lookup,
							ownerId,
							store: frame.store,
							key: key(frame.value.id ?? frame.value.questionId),
							data: JSON.stringify(frame.value),
							position: index + i,
							revision: 0,
							sourceHash: snapshot.sha256,
							chunkedSize: frame.blobSize !== undefined && frame.blobSize > MAX_BACKUP_BYTES ? frame.blobSize : null,
						};
					});
					await records.insert(rows);
					for (const [i, frame] of batch.entries()) {
						if (frame.blobSize === undefined) continue;
						const identity = { ownerId, store: frame.store, key: rows[i].key };
						const attachment = snapshot.blob.slice(frame.blobOffset, frame.blobOffset + frame.blobSize);
						if (rows[i].chunkedSize === null) {
							await records.update(identity, { blob: Buffer.from(await attachment.arrayBuffer()) });
						} else {
							for (let start = 0; start < attachment.size; start += SOURCE_CHUNK_BYTES) {
								const bytes = Buffer.from(await attachment.slice(start, start + SOURCE_CHUNK_BYTES).arrayBuffer());
								await manager.getRepository(MiFukushuUpstreamChunk).insert({ ...identity, part: start / SOURCE_CHUNK_BYTES, bytes });
							}
						}
					}
					index = end;
				}
				// The source can place logs before their deck. Set counts after all frames exist.
				if (deckCounts.size) await manager.query(`UPDATE fukushu_upstream_record d SET "indexedReviews" = n.total
					FROM unnest($2::text[], $3::int[]) AS n(key, total)
					WHERE d."ownerId" = $1 AND d.store = 'decks' AND d.key = n.key`,
				[ownerId, [...deckCounts.keys()], [...deckCounts.values()]]);
				await this.refreshUsage(manager, ownerId);
				const result = { restored: true as const, sha256: snapshot.sha256, records: frames.length };
				await manager.getRepository(MiFukushuOperationReceipt).insert({ ownerId, id, request, result: JSON.stringify(result) });
				return result;
			});
		} catch (error) {
			if (error instanceof QueryFailedError && error.driverError.code === '23505') throw new BackupError('BACKUP_CONFLICT');
			throw error;
		}
	}

	private async refreshUsage(manager: EntityManager, ownerId: string) {
		// UTF-8 frame JSON contributes 21 fixed bytes around store/value and 12 around an optional blobSize.
		const [usage] = await manager.query(`INSERT INTO fukushu_source_usage ("ownerId", count, last, logs, bytes, binaries, "materialBytes")
			SELECT "ownerId", COUNT(*)::int, MAX(position),
				COUNT(*) FILTER (WHERE store = 'reviewLogs')::int,
				SUM(octet_length(data) + octet_length(store) + 21
					+ CASE WHEN size IS NULL THEN 0 ELSE 12 + length(size::text) END)::int,
				SUM(COALESCE(size, 0))::int,
				SUM(octet_length(data) + octet_length(store) + 21
					+ CASE WHEN size IS NULL THEN 0 ELSE 12 + length(size::text) END) FILTER (WHERE store <> 'reviewLogs')::int
			FROM (
				SELECT "ownerId", position, store, data, COALESCE("chunkedSize", octet_length(blob)) AS size
				FROM fukushu_upstream_record WHERE "ownerId" = $1
			) records GROUP BY "ownerId"
			ON CONFLICT ("ownerId") DO UPDATE SET count = EXCLUDED.count, last = EXCLUDED.last,
				logs = EXCLUDED.logs, bytes = EXCLUDED.bytes, binaries = EXCLUDED.binaries, "materialBytes" = EXCLUDED."materialBytes"
			RETURNING count, bytes, binaries, "materialBytes"`, [ownerId]);
		if (usage.materialBytes > MAX_BACKUP_BYTES || usage.bytes > MAX_SOURCE_JSON_BYTES || usage.bytes + usage.binaries + usage.count * 4 + UPSTREAM_MAGIC.length + 64 > MAX_SOURCE_ARCHIVE_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
	}

	private materialRecords(frames: Iterable<UpstreamFrame>) {
		const records = emptyUpstreamRecords();
		let count = 0;
		for (const { store, value } of frames) {
			const parsed = v.safeParse(upstreamStoreSchemas[store], value);
			if (!parsed.success) throw new BackupError('INVALID_BACKUP');
			(records[store] as unknown[]).push(parsed.output);
			checkMaterialCount(store, records, ++count, 10_000);
		}
		checkUpstreamRelations(records, new Set(records.media.map(row => row.id)));
		return records;
	}

	/** With an offset the wire page is independent of the physical layout. An offset past EOF returns an empty page. */
	async media(ownerId: string, id: string, offset?: number) {
		const mediaKey = key(id);
		const start = offset ?? 0;
		const limit = offset === undefined ? MAX_BACKUP_BYTES : 1024 * 1024;
		const [row] = await this.db.query<{ data: string; size: number | null; chunked: boolean; bytes: Buffer | null }[]>(`
			SELECT data, COALESCE("chunkedSize", octet_length(blob)) AS size, "chunkedSize" IS NOT NULL AS chunked,
				substring(blob FROM least($3::integer, COALESCE(octet_length(blob), 0)) + 1 FOR $4::integer) AS bytes
			FROM fukushu_upstream_record WHERE "ownerId" = $1 AND store = 'media' AND key = $2`, [ownerId, mediaKey, start, limit]);
		if (row?.size == null) throw new MaterialError('NO_SUCH_MATERIAL');
		const size = row.size;
		if (offset === undefined && size > limit) throw new BackupError('BACKUP_TOO_LARGE');
		const length = Math.min(limit, Math.max(0, size - start));
		let bytes = row.bytes;
		if (row.chunked && length > 0) {
			const first = Math.floor(start / SOURCE_CHUNK_BYTES);
			const last = Math.floor((start + length - 1) / SOURCE_CHUNK_BYTES);
			const parts = await this.db.query<{ part: number; bytes: Buffer }[]>(`
				SELECT part, bytes FROM fukushu_upstream_chunk
				WHERE "ownerId" = $1 AND store = 'media' AND key = $2 AND part BETWEEN $3 AND $4
				ORDER BY part`, [ownerId, mediaKey, first, last]);
			if (parts.length !== last - first + 1) throw new BackupError('BACKUP_FAILED');
			const slices = parts.map((part, index) => {
				const base = (first + index) * SOURCE_CHUNK_BYTES;
				if (part.part !== first + index || part.bytes.length !== Math.min(SOURCE_CHUNK_BYTES, size - base)) throw new BackupError('BACKUP_FAILED');
				return part.bytes.subarray(Math.max(0, start - base), start + length - base);
			});
			bytes = Buffer.concat(slices, length);
		}
		if ((bytes?.length ?? 0) !== length) throw new BackupError('BACKUP_FAILED');
		return { mimeType: String(JSON.parse(row.data).mimeType), base64: bytes?.toString('base64') ?? '',
			...(offset === undefined ? {} : { totalBytes: size }) };
	}

	async updateGift(ownerId: string, deckId: string, fileId: string, readGift: () => Promise<Buffer>, expected?: string) {
		const bytes = await readGift();
		let source: string;
		try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new BackupError('INVALID_BACKUP'); }
		return this.db.transaction(async manager => {
			await this.lock(manager, ownerId);
			const repo = manager.getRepository(MiFukushuUpstreamRecord);
			const usage = manager.getRepository(MiFukushuSourceUsage);
			const budget = await usage.findOneBy({ ownerId });
			if (!budget) throw new MaterialError('NO_SUCH_MATERIAL');
			// Every supported collection edit appends a log or import frame under the owner lock.
			const token = hash(JSON.stringify([ownerId, deckId, fileId, hash(bytes), budget.last]));
			if (expected !== undefined && token !== expected) throw new StudyError('STUDY_CONFLICT');
			const [file] = await manager.query('SELECT md5, size FROM drive_file WHERE id = $1 AND "userId" = $2 AND "userHost" IS NULL AND uri IS NULL AND NOT "isLink" FOR SHARE', [fileId, ownerId]);
			if (!file || file.size !== bytes.length || file.md5 !== createHash('md5').update(bytes).digest('hex')) throw new BackupError('BACKUP_FAILED');
			const rows = await repo.find({
				where: { ownerId, store: In(materialStores) },
				select: { store: true, key: true, data: true, revision: true },
				order: { position: 'ASC', store: 'ASC', key: 'ASC' },
			});
			const existing = new Map(rows.map(row => [row.store + ':' + row.key, row]));
			const frames = new Map(rows.map(row => [row.store + ':' + row.key, { store: row.store as UpstreamFrame['store'], value: JSON.parse(row.data) }]));
			const deck = frames.get('decks:' + key(deckId));
			if (!deck) throw new MaterialError('NO_SUCH_MATERIAL');
			const { writes, summary } = planGiftUpdate(this.materialRecords(frames.values()), deck.value, deckId, source, this.clock());
			const identity = (frame: UpstreamFrame) => frame.store + ':' + key(frame.value.id ?? frame.value.questionId);
			const written = new Set<string>();
			let delta = 0;
			let appended = 0;
			for (const frame of writes) {
				const id = identity(frame);
				if (written.has(id)) throw new BackupError('BACKUP_CONFLICT');
				written.add(id);
				const old = existing.get(id);
				if (frame.store === 'imports' && old) throw new BackupError('BACKUP_CONFLICT');
				if (old) delta += Buffer.byteLength(JSON.stringify(frame.value)) - Buffer.byteLength(old.data);
				else {
					delta += Buffer.byteLength(JSON.stringify(frame));
					appended++;
				}
				frames.set(id, frame);
			}
			this.materialRecords(frames.values());
			const count = budget.count + appended;
			const jsonBytes = budget.bytes + delta;
			const materialBytes = budget.materialBytes + delta;
			if (materialBytes > MAX_BACKUP_BYTES || jsonBytes > MAX_SOURCE_JSON_BYTES ||
				UPSTREAM_MAGIC.length + 64 + count * 4 + budget.binaries + jsonBytes > MAX_SOURCE_ARCHIVE_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
			if (expected !== undefined) {
				let position = budget.last;
				for (const frame of writes) {
					const id = key(frame.value.id ?? frame.value.questionId);
					const old = existing.get(identity(frame));
					const data = JSON.stringify(frame.value);
					if (old) {
						await repo.update({ ownerId, store: frame.store, key: id }, { data, revision: old.revision + 1 });
					} else {
						if (frame.store === 'questions' && (await manager.query('SELECT 1 FROM fukushu_question WHERE "ownerId" = $1 AND id = $2', [ownerId, frame.value.id])).length) throw new BackupError('BACKUP_CONFLICT');
						await repo.insert({ ownerId, store: frame.store, key: id, data, revision: 0, blob: null, position: ++position, sourceHash: hash(bytes) });
					}
				}
				await usage.update({ ownerId }, { count, last: position, bytes: jsonBytes, materialBytes });
			}
			return { ...summary, token, applied: expected !== undefined };
		});
	}

	async assertOwned(ownerId: string) {
		if (!await this.db.getRepository(MiFukushuUpstreamRecord).existsBy({ ownerId, store: 'settings' })) throw new MaterialError('NO_SUCH_MATERIAL');
	}

	async show(ownerId: string, page?: SourceHistoryPage) {
		const indexing = page?.deckId !== undefined;
		return this.db.transaction(indexing ? 'READ COMMITTED' : 'REPEATABLE READ', async manager => {
			if (indexing) {
				// All source writers take this owner lock. An older writer may have appended
				// unindexed logs since the preceding page.
				await this.lock(manager, ownerId);
				await this.indexPendingReviews(manager, ownerId);
			}
			const repo = manager.getRepository(MiFukushuUpstreamRecord);
			if (!page) {
				const usage = await manager.getRepository(MiFukushuSourceUsage).findOneBy({ ownerId });
				if (usage && usage.bytes > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
			}
			const rows = await repo.find({ where: page ? { ownerId, store: In(materialStores) } : { ownerId }, select: { store: true, key: true, data: true, revision: true, indexedReviews: true }, order: { position: 'ASC', store: 'ASC', key: 'ASC' } });
			if (!rows.length) throw new MaterialError('NO_SUCH_MATERIAL');
			const records = emptyUpstreamRecords();
			const questionIds = new Map<string, string>();
			let historyTotal = 0;
			const revisions = [];
			for (const row of rows) {
				const store = row.store as keyof typeof records;
				const value = JSON.parse(row.data);
				(records[store] as unknown[]).push(v.parse(upstreamStoreSchemas[store], value));
				if (store === 'decks' && page?.deckId === value.id) historyTotal = row.indexedReviews ?? 0;
				if (store === 'questions') questionIds.set(row.key, value.id);
				if (store === 'studyStates') revisions.push({ questionId: String(value.questionId), revision: row.revision });
			}
			if (page?.deckId !== undefined) {
				const { logs, next, today } = await this.historyPage(manager, ownerId, page.deckId, page);
				records.reviewLogs = logs;
				return { records, revisions, historyPage: { next, total: historyTotal, today: today.map(row => questionIds.get(row.historyQuestion)).filter((id): id is string => id !== undefined) } };
			}
			return { records, revisions };
		});
	}

	// Negative UTC milliseconds preserve newest-first order with an ascending key tie-break.
	private historyOrder(time: string) {
		const millis = Date.parse(time);
		return Number.isFinite(millis) ? String(-millis) : '9223372036854775807';
	}

	private historyFields(log: Record<string, unknown>) {
		return { historyDeck: key(log.deckId), historyQuestion: key(log.questionId), historyOrder: this.historyOrder(String(log.reviewedAt)) };
	}

	private async indexPendingReviews(manager: EntityManager, ownerId: string) {
		const pending = await manager.query(`SELECT 1 FROM fukushu_upstream_record WHERE "ownerId" = $1
			AND store = 'reviewLogs' AND "historyDeck" IS NULL LIMIT 1`, [ownerId]);
		if (!pending.length) return;
		await manager.query(`DECLARE fukushu_pending NO SCROLL CURSOR FOR SELECT key, data FROM fukushu_upstream_record
			WHERE "ownerId" = $1 AND store = 'reviewLogs' AND "historyDeck" IS NULL`, [ownerId]);
		for (;;) {
			const rows: { key: string; data: string }[] = await manager.query('FETCH FORWARD 32 FROM fukushu_pending');
			if (!rows.length) break;
			const entries = rows.map(row => {
				return { key: row.key, ...this.historyFields(JSON.parse(row.data)) };
			});
			await manager.query(`WITH indexed AS (
				UPDATE fukushu_upstream_record r SET "historyDeck" = v.deck, "historyOrder" = v.ord, "historyQuestion" = v.question
				FROM unnest($2::text[], $3::text[], $4::bigint[], $5::text[]) AS v(key, deck, ord, question)
				WHERE r."ownerId" = $1 AND r.store = 'reviewLogs' AND r.key = v.key AND r."historyDeck" IS NULL
				RETURNING r."historyDeck"
			), totals AS (SELECT "historyDeck", count(*)::int AS n FROM indexed GROUP BY "historyDeck")
			UPDATE fukushu_upstream_record d SET "indexedReviews" = COALESCE(d."indexedReviews", 0) + t.n
			FROM totals t WHERE d."ownerId" = $1 AND d.store = 'decks' AND d.key = t."historyDeck"`,
			[ownerId, entries.map(e => e.key), entries.map(e => e.historyDeck), entries.map(e => e.historyOrder), entries.map(e => e.historyQuestion)]);
		}
	}

	private async historyPage(manager: EntityManager, ownerId: string, deckId: string, page: SourceHistoryPage) {
		const deckKey = key(deckId);
		const parameters = page.after ? [ownerId, deckKey, this.historyOrder(page.after.time), page.after.key] : [ownerId, deckKey];
		const after = page.after ? 'AND ("historyOrder", key COLLATE "C") > ($3::bigint, $4 COLLATE "C")' : '';
		type Candidate = { key: string; size: number };
		const latest: Candidate[] = await manager.query(`SELECT key, octet_length(data) AS size FROM fukushu_upstream_record
			WHERE "ownerId" = $1 AND store = 'reviewLogs' AND "historyDeck" = $2 ${after}
			ORDER BY "historyOrder", key COLLATE "C" LIMIT 21`, parameters);
		const today: { historyQuestion: string }[] = page.day ? await manager.query(`SELECT DISTINCT "historyQuestion"
			FROM fukushu_upstream_record WHERE "ownerId" = $1 AND store = 'reviewLogs' AND "historyDeck" = $2
			AND "historyOrder" > $3 AND "historyOrder" <= $4`,
		[ownerId, deckKey, this.historyOrder(page.day.end), this.historyOrder(page.day.start)]) : [];

		const selected: Candidate[] = [];
		let size = 0;
		for (const item of latest) {
			if (selected.length === 20 || (selected.length > 0 && size + item.size > 256 * 1024)) break;
			selected.push(item);
			size += item.size;
		}
		const rows = selected.length ? await manager.getRepository(MiFukushuUpstreamRecord).findBy({
			ownerId, store: 'reviewLogs', key: In(selected.map(item => item.key)),
		}) : [];
		const logsByKey = new Map(rows.map(row => [row.key, v.parse(upstreamStoreSchemas.reviewLogs, JSON.parse(row.data))]));
		const logs = selected.map(item => {
			const log = logsByKey.get(item.key);
			if (!log) throw new BackupError('BACKUP_FAILED');
			return log;
		});
		const last = selected.at(-1);
		const next = last && selected.length < latest.length ? { time: logs[logs.length - 1].reviewedAt, key: last.key } : null;
		return { logs, today, next };
	}

	/** Await each write inside a single snapshot. The caller publishes only after completion. */
	async writeExport(ownerId: string, write: (bytes: Buffer) => Promise<void>) {
		await this.db.transaction('REPEATABLE READ', async manager => {
			// A transaction-local cursor keeps one ordered snapshot while bounding the
			// number of metadata rows delivered to the application at once.
			await manager.query(`DECLARE fukushu_export NO SCROLL CURSOR FOR
				SELECT store, key, data, COALESCE("chunkedSize", octet_length(blob)) AS size, ("chunkedSize" IS NOT NULL) AS chunked
				FROM fukushu_upstream_record WHERE "ownerId" = $1 ORDER BY position, store, key`, [ownerId]);
			type Row = { store: string; key: string; data: string; size: number | null; chunked: boolean };
			const nextPage = (): Promise<Row[]> => manager.query('FETCH FORWARD 32 FROM fukushu_export');
			let rows = await nextPage();
			if (!rows.length) throw new MaterialError('NO_SUCH_MATERIAL');
			const digest = createHash('sha256');
			let total = 64;

			async function payload(bytes: Buffer) {
				total += bytes.length;
				if (total > MAX_SOURCE_ARCHIVE_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
				digest.update(bytes);
				await write(bytes);
			}

			await payload(Buffer.from(UPSTREAM_MAGIC));
			while (rows.length > 0) {
				for (const row of rows) {
					const json = Buffer.from(JSON.stringify({ store: row.store, value: JSON.parse(row.data), ...(row.size === null ? {} : { blobSize: row.size }) }));
					const header = Buffer.alloc(4);
					header.writeUInt32LE(json.length);
					await payload(Buffer.concat([header, json]));
					const mediaHash = row.store === 'media' ? createHash('sha256') : undefined;
					for (let offset = 0; offset < (row.size ?? 0); offset += SOURCE_CHUNK_BYTES) {
						const [result] = row.chunked
							? await manager.query('SELECT bytes FROM fukushu_upstream_chunk WHERE "ownerId" = $1 AND store = $2 AND key = $3 AND part = $4', [ownerId, row.store, row.key, offset / SOURCE_CHUNK_BYTES])
							: await manager.query('SELECT substring(blob FROM $4 FOR $5) AS bytes FROM fukushu_upstream_record WHERE "ownerId" = $1 AND store = $2 AND key = $3', [ownerId, row.store, row.key, offset + 1, SOURCE_CHUNK_BYTES]);
						if (result?.bytes.length !== Math.min(SOURCE_CHUNK_BYTES, Number(row.size) - offset)) throw new BackupError('BACKUP_FAILED');
						mediaHash?.update(result.bytes);
						await payload(result.bytes);
					}
					if (mediaHash && mediaHash.digest('hex') !== JSON.parse(row.data).id) throw new BackupError('BACKUP_FAILED');
				}
				rows = await nextPage();
			}
			await write(Buffer.from(digest.digest('hex')));
		});
	}

	async review(ownerId: string, input: PersistedUpstreamReview) {
		const id = v.parse(studyRequestIdSchema, input.requestId);
		// Stable identity does not include server time. Never accept a caller-supplied owner/time.
		const request = JSON.stringify({ operation: 'review', questionId: input.questionId, expectedRevision: input.expectedRevision, rating: input.rating, correct: input.correct, answers: input.answers, durationMs: input.durationMs });
		return this.db.transaction(async manager => {
			await this.lock(manager, ownerId);
			const previous = await this.receipt(manager, ownerId, id, request);
			if (previous) return previous;
			if (await manager.query('SELECT 1 FROM fukushu_review_log WHERE "ownerId" = $1 AND id = $2::uuid', [ownerId, id]).then(rows => rows.length > 0)) throw new StudyError('STUDY_CONFLICT');
			const records = manager.getRepository(MiFukushuUpstreamRecord);
			if (await records.existsBy({ ownerId, store: 'reviewLogs', key: key(id) })) throw new CompatibilitySessionError('HISTORY_ID_EXISTS');
			const cardKey = key(input.questionId);
			const usage = manager.getRepository(MiFukushuSourceUsage);
			const budget = await usage.findOneBy({ ownerId });
			if (!budget) throw new MaterialError('NO_SUCH_MATERIAL');
			const state = await records.findOneBy({ ownerId, store: 'studyStates', key: cardKey });
			if (!state || state.revision !== input.expectedRevision || state.revision === 2_147_483_647) throw new StudyError('STUDY_CONFLICT');
			const question = await records.findOneByOrFail({ ownerId, store: 'questions', key: cardKey });
			const settings = await records.findOneByOrFail({ ownerId, store: 'settings', key: key('global') });
			const original = JSON.parse(state.data);
			const result = { revision: state.revision + 1, ...applyUpstreamReview({ ...input, requestId: id, reviewedAt: this.clock().toISOString() },
				v.parse(upstreamStoreSchemas.questions, JSON.parse(question.data)),
				v.parse(upstreamStoreSchemas.studyStates, original),
				v.parse(upstreamStoreSchemas.settings, JSON.parse(settings.data)).desiredRetention) };
			const data = JSON.stringify({ ...original, card: result.state.card, updatedAt: result.state.updatedAt });
			const logData = JSON.stringify(result.record);
			const stateDelta = Buffer.byteLength(data) - Buffer.byteLength(state.data);
			const logBytes = Buffer.byteLength(JSON.stringify({ store: 'reviewLogs', value: result.record }));
			const materialBytes = budget.materialBytes + stateDelta;
			const jsonBytes = budget.bytes + stateDelta + logBytes;
			const fileBytes = UPSTREAM_MAGIC.length + 64 + (budget.count + 1) * 4 + Number(budget.binaries) + jsonBytes;
			if (logBytes > MAX_BACKUP_BYTES || materialBytes > MAX_BACKUP_BYTES || jsonBytes > MAX_SOURCE_JSON_BYTES || fileBytes > MAX_SOURCE_ARCHIVE_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
			await usage.update({ ownerId }, { count: budget.count + 1, last: budget.last + 1, logs: budget.logs + 1, bytes: jsonBytes, materialBytes });
			await records.update({ ownerId, store: state.store, key: cardKey }, { data, revision: result.revision });
			const lookup = this.historyFields(result.record);
			await records.insert({ ...lookup, ownerId, store: 'reviewLogs', key: key(id), data: logData, blob: null, revision: 0, position: budget.last + 1, sourceHash: state.sourceHash });
			await manager.query(`UPDATE fukushu_upstream_record SET "indexedReviews" = COALESCE("indexedReviews", 0) + 1
				WHERE "ownerId" = $1 AND store = 'decks' AND key = $2`, [ownerId, lookup.historyDeck]);
			await manager.getRepository(MiFukushuOperationReceipt).insert({ ownerId, id, request, result: JSON.stringify(result) });
			return result;
		});
	}
}
