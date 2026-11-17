/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import * as v from 'valibot';
import { MAX_BACKUP_BYTES } from '../../shared/backup.schema.js';
import { readUpstreamArchive, UPSTREAM_MAGIC, UpstreamBackupError } from '../../shared/upstream-reader.js';
import { studyRatingSchema, studyRequestIdSchema } from '../../shared/study.schema.js';
import { upstreamStoreSchemas } from '../../shared/upstream-records.js';
import { review } from '../fsrs.js';
import type { UpstreamArchive, UpstreamFrame } from '../../shared/upstream-reader.js';
import type { UpstreamRecords } from '../../shared/upstream-records.js';

const sha256 = async (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const inputSchema = v.strictObject({
	requestId: studyRequestIdSchema,
	questionId: v.string(),
	expectedRevision: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
	rating: studyRatingSchema,
	correct: v.boolean(),
	answers: v.array(v.string()),
	durationMs: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
	reviewedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type CompatibilityReviewInput = v.InferOutput<typeof inputSchema>;
type Result = { revision: number; state: UpstreamRecords['studyStates'][number]; record: UpstreamRecords['reviewLogs'][number] };
export class CompatibilitySessionError extends Error {
	constructor(public readonly code: 'STALE_STATE' | 'REQUEST_CONFLICT' | 'HISTORY_ID_EXISTS' | 'NOT_STUDYABLE') { super(code); }
}

/** Existing upstream binary framing, not a new backup version. Never writes schema defaults. */
async function encode(frames: UpstreamFrame[]): Promise<UpstreamArchive> {
	const parts: Uint8Array[] = [new TextEncoder().encode(UPSTREAM_MAGIC)];
	let size = parts[0].length + 64;
	for (const frame of frames) {
		const json = new TextEncoder().encode(JSON.stringify({ store: frame.store, value: frame.value, ...(frame.blob === undefined ? {} : { blobSize: frame.blob.length }) }));
		size += 4 + json.length + (frame.blob?.length ?? 0);
		if (size > MAX_BACKUP_BYTES) throw new UpstreamBackupError('BACKUP_TOO_LARGE');
		const length = new Uint8Array(4);
		new DataView(length.buffer).setUint32(0, json.length, true);
		parts.push(length, json);
		if (frame.blob !== undefined) parts.push(frame.blob);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) { bytes.set(part, offset); offset += part.length; }
	bytes.set(new TextEncoder().encode(await sha256(bytes.subarray(0, offset))), offset);
	return readUpstreamArchive(bytes, sha256);
}

/** Unregistered, in-memory compatibility pilot. No API, owner store or native-v1 mutation.
 * Imported log IDs/reps are independent of this session's optimistic revision counters.
 * A future persistent adapter must commit records and retry receipts in one owner transaction.
 */
export class UpstreamCompatibilitySession {
	private readonly revisions = new Map<string, number>();
	private readonly requests = new Map<string, { fingerprint: string; result: Result }>();
	private constructor(private archive: UpstreamArchive) {}

	static async open(bytes: Uint8Array): Promise<UpstreamCompatibilitySession> {
		return new UpstreamCompatibilitySession(await readUpstreamArchive(bytes, sha256));
	}

	snapshot(): UpstreamRecords { return this.archive.normalizedRecords(); }
	export(): Uint8Array { return this.archive.originalBytes(); }

	async recordReview(raw: CompatibilityReviewInput): Promise<Result> {
		const input = v.parse(inputSchema, raw);
		const fingerprint = JSON.stringify(input);
		const replay = () => {
			const previous = this.requests.get(input.requestId);
			if (previous && previous.fingerprint !== fingerprint) throw new CompatibilitySessionError('REQUEST_CONFLICT');
			return previous ? structuredClone(previous.result) : undefined;
		};
		const previous = replay();
		if (previous) return previous;
		const baseline = this.archive;
		const records = baseline.normalizedRecords();
		if (records.reviewLogs.some(log => log.id === input.requestId)) throw new CompatibilitySessionError('HISTORY_ID_EXISTS');
		const revision = this.revisions.get(input.questionId) ?? 0;
		if (input.expectedRevision !== revision) throw new CompatibilitySessionError('STALE_STATE');
		const question = records.questions.find(row => row.id === input.questionId);
		const state = records.studyStates.find(row => row.questionId === input.questionId);
		if (!question?.enabled || !state || state.suspended || question.kind === 'unsupported') throw new CompatibilitySessionError('NOT_STUDYABLE');
		const scheduled = review(state.card, new Date(input.reviewedAt), input.rating, records.settings[0].desiredRetention);
		const nextState = v.parse(upstreamStoreSchemas.studyStates, { ...state, card: scheduled.card, updatedAt: input.reviewedAt });
		const record = v.parse(upstreamStoreSchemas.reviewLogs, {
			id: input.requestId, questionId: question.id, deckId: question.deckId,
			reviewedAt: input.reviewedAt, rating: input.rating, correct: input.correct,
			durationMs: input.durationMs, fsrsLog: scheduled.log,
			...(['single-choice', 'multiple-choice', 'matching'].includes(question.kind)
				? { selectedAnswerIds: input.answers } : { responseText: input.answers[0] ?? '' }),
		});
		const frames = baseline.frames();
		const index = frames.findIndex(frame => frame.store === 'studyStates' && frame.value.questionId === question.id);
		// Preserve original optional source values; replace only the reviewed state and append one log.
		frames[index] = { ...frames[index], value: { ...frames[index].value, card: nextState.card, updatedAt: nextState.updatedAt } };
		frames.push({ store: 'reviewLogs', value: record });
		const candidate = await encode(frames);
		const concurrentReplay = replay();
		if (concurrentReplay) return concurrentReplay;
		if (this.archive !== baseline) throw new CompatibilitySessionError('STALE_STATE');
		const result = { revision: revision + 1, state: nextState, record };
		this.archive = candidate;
		this.revisions.set(question.id, result.revision);
		this.requests.set(input.requestId, { fingerprint, result });
		return structuredClone(result);
	}
}
