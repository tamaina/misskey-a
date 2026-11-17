/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import * as v from 'valibot';
import { backupEnvelopeSchema, backupPayloadSchema, MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import type { BackupPayload } from '../shared/backup.schema.js';

export class BackupError extends Error {
	constructor(public readonly code: 'INVALID_BACKUP' | 'BACKUP_TOO_LARGE' | 'UPSTREAM_BACKUP_UNSUPPORTED' | 'BACKUP_FAILED') { super(code); }
}

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Checks saved relations and continuity without regrading or invoking FSRS. */
export function validateBackup(value: unknown): BackupPayload {
	const parsed = v.safeParse(backupPayloadSchema, value);
	if (!parsed.success) throw new BackupError('INVALID_BACKUP');
	const p = parsed.output;
	const check = (ok: unknown) => { if (!ok) throw new BackupError('INVALID_BACKUP'); };
	const questions = new Map(p.material.questions.map(q => [q.id, q]));
	const metadata = new Map(p.questions.map(q => [q.questionId, q]));
	check(metadata.size === questions.size && p.questions.length === questions.size);
	for (const [position, question] of p.material.questions.entries()) {
		const meta = metadata.get(question.id);
		check(meta && meta.position === position);
	}
	const versions = new Map<string, Map<number, BackupPayload['versions'][number]>>();
	for (const row of p.versions) {
		const current = questions.get(row.questionId);
		check(current && row.data.id === row.questionId && row.data.deckId === p.material.deck.id
			&& row.data.payload.id === row.questionId && row.data.payload.deckId === p.material.deck.id
			&& row.data.payload.sourceKey === row.data.sourceKey && row.data.enabledKey === Number(row.data.enabled));
		const entries = versions.get(row.questionId) ?? new Map();
		check(!entries.has(row.version));
		check(row.kind === (row.version === 1 ? 'baseline' : 'explanation'));
		entries.set(row.version, row); versions.set(row.questionId, entries);
	}
	for (const meta of p.questions) {
		const rows = versions.get(meta.questionId);
		if (meta.currentVersion === 1 && !rows) continue; // Untouched baseline remains virtual.
		check(rows?.size === meta.currentVersion);
		for (let version = 1; version <= meta.currentVersion; version++) check(rows?.has(version));
		check(isDeepStrictEqual(rows?.get(meta.currentVersion)?.data, questions.get(meta.questionId)));
	}
	const states = new Map(p.states.map(row => [row.questionId, row]));
	check(states.size === p.states.length);
	for (const row of p.states) check(questions.has(row.questionId) && row.data.questionId === row.questionId
		&& row.data.deckId === p.material.deck.id && row.data.suspendedKey === Number(row.data.suspended));
	const ids = new Set<string>();
	const reviews = new Map<string, BackupPayload['reviews']>();
	for (const row of p.reviews) {
		check(!ids.has(row.id)); ids.add(row.id);
		check(versions.get(row.questionId)?.has(row.questionVersion) && states.has(row.questionId));
		check(row.data.id === row.id && row.data.questionId === row.questionId && row.data.deckId === p.material.deck.id
			&& row.data.reviewedAt === row.reviewedAt && row.request.id === p.material.deck.id
			&& row.request.questionId === row.questionId && row.request.questionVersion === row.questionVersion
			&& row.request.requestId === row.id && row.request.expectedStateRevision === row.stateRevision - 1
			&& row.data.rating === row.request.rating && row.data.durationMs === row.request.durationMs
			&& row.data.correct === (row.data.rating !== 'again') && row.data.responseText === '');
		const entries = reviews.get(row.questionId) ?? [];
		entries.push(row); reviews.set(row.questionId, entries);
	}
	for (const state of p.states) {
		const rows = reviews.get(state.questionId)?.slice().sort((a, b) => a.stateRevision - b.stateRevision);
		check(rows?.length === state.revision);
		for (const [index, row] of (rows ?? []).entries()) {
			check(row.stateRevision === index + 1 && row.after.reps === row.stateRevision
				&& row.before.reps === index && row.after.lastReview === row.reviewedAt);
			if (index > 0) check(isDeepStrictEqual(row.before, rows![index - 1].after)
				&& Date.parse(row.reviewedAt) >= Date.parse(rows![index - 1].reviewedAt));
		}
		check(isDeepStrictEqual(rows?.at(-1)?.after, state.data.card)
			&& rows?.at(-1)?.reviewedAt === state.data.updatedAt);
	}
	return p;
}

export function encodeBackup(value: unknown): Buffer {
	const payload = validateBackup(value);
	const bytes = Buffer.from(JSON.stringify({ format: 'misskey-fukushu-deck-backup', version: 1, payload, sha256: digest(payload) }));
	if (bytes.length > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
	return bytes;
}

export function decodeBackup(bytes: Buffer): BackupPayload {
	if (bytes.length > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
	if (bytes.subarray(0, 17).toString() === 'FUKUSHU-BACKUP-1\n') throw new BackupError('UPSTREAM_BACKUP_UNSUPPORTED');
	let raw: unknown;
	try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new BackupError('INVALID_BACKUP'); }
	if (typeof raw === 'object' && raw !== null && 'format' in raw && raw.format === 'gift-fsrs-learning-backup') throw new BackupError('UPSTREAM_BACKUP_UNSUPPORTED');
	const parsed = v.safeParse(backupEnvelopeSchema, raw);
	if (!parsed.success || parsed.output.sha256 !== digest((raw as { payload: unknown }).payload)) throw new BackupError('INVALID_BACKUP');
	return validateBackup(parsed.output.payload);
}
