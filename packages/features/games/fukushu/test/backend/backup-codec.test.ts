/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { decodeBackup, encodeBackup, validateBackup, validateBackupMedia } from '../../backend/backup-codec.js';
import { MAX_BACKUP_BYTES } from '../../shared/backup.schema.js';
import { backupFixture, mediaBackupFixture } from './backup-fixture.js';
import type { BackupPayload } from '../../shared/backup.schema.js';

test('round trips all upstream-shaped records and server history without mutation or rescheduling', () => {
	const snapshot = backupFixture(); const before = structuredClone(snapshot);
	const bytes = encodeBackup(snapshot);
	expect(decodeBackup(bytes)).toEqual(before);
	expect(snapshot).toEqual(before);
	expect(encodeBackup(decodeBackup(bytes))).toEqual(bytes);
	const envelope = JSON.parse(bytes.toString());
	expect(envelope.version).toBe(1);
	expect(envelope.payload).not.toHaveProperty('media');
	expect(envelope.sha256).toBe(createHash('sha256').update(JSON.stringify(envelope.payload)).digest('hex'));
	expect(envelope.payload.reviews[0].request).toEqual(before.reviews[0].request);
	expect(envelope.payload.states[0].data).toEqual(before.states[0].data);
});

test('keeps unreviewed baselines and states virtual and keeps archived snapshots', () => {
	const p = backupFixture(); p.reviews = []; p.states = []; p.versions = [];
	p.deckState.archivedAt = p.exportedAt;
	expect(decodeBackup(encodeBackup(p))).toEqual(p);
});

const invalid: [string, (p: BackupPayload) => void][] = [
	['missing question metadata', p => { p.questions = []; }],
	['duplicate metadata', p => { p.questions.push(p.questions[0]); }],
	['wrong position', p => { p.questions[0].position = 1; }],
	['missing pinned version', p => { p.versions = []; }],
	['duplicate version', p => { p.versions.push(p.versions[0]); }],
	['missing current version', p => { p.questions[0].currentVersion = 2; }],
	['wrong baseline kind', p => { p.versions[0].kind = 'explanation'; }],
	['changed current snapshot', p => { p.versions[0].data.payload.answer.value = 'changed'; }],
	['foreign version', p => { p.versions[0].data.deckId = 'foreign'; }],
	['missing state', p => { p.states = []; }],
	['duplicate state', p => { p.states.push(p.states[0]); }],
	['foreign state', p => { p.states[0].data.deckId = 'foreign'; }],
	['suspension key mismatch', p => { p.states[0].data.suspendedKey = 1; }],
	['missing review', p => { p.reviews = []; }],
	['duplicate request', p => { p.reviews.push(p.reviews[0]); }],
	['unknown version', p => { p.reviews[0].questionVersion = 2; }],
	['wrong record identity', p => { p.reviews[0].data.questionId = 'foreign'; }],
	['wrong request identity', p => { p.reviews[0].request.id = 'foreign'; }],
	['changed rating', p => { p.reviews[0].request.rating = 'again'; }],
	['missing duration', p => { delete p.reviews[0].data.durationMs; }],
	['fabricated correctness', p => { p.reviews[0].data.correct = false; }],
	['retained typed answer', p => { p.reviews[0].data.responseText = 'not upstream flashcard behavior'; }],
	['broken state revision', p => { p.states[0].revision = 2; }],
	['broken review revision', p => { p.reviews[0].stateRevision = 2; }],
	['broken after state', p => { p.states[0].data.card.due = p.exportedAt; }],
	['changed clock', p => { p.reviews[0].reviewedAt = '2020-01-01T00:00:00.000Z'; }],
];
test.each(invalid)('rejects %s without modifying the snapshot', (_name, change) => {
	const p = backupFixture(); change(p); const before = structuredClone(p);
	expect(() => validateBackup(p)).toThrow('INVALID_BACKUP');
	expect(p).toEqual(before);
});

test('rejects corrupt bytes, unknown attributes, unsupported versions and schedulers', () => {
	const bytes = encodeBackup(backupFixture());
	const corrupted = JSON.parse(bytes.toString()); corrupted.payload.material.deck.name = 'changed';
	expect(() => decodeBackup(Buffer.from(JSON.stringify(corrupted)))).toThrow('INVALID_BACKUP');
	for (const patch of [{ version: 2 }, { unknown: true }]) {
		expect(() => decodeBackup(Buffer.from(JSON.stringify({ ...JSON.parse(bytes.toString()), ...patch })))).toThrow('INVALID_BACKUP');
	}
	const unknown = { ...backupFixture(), ownerId: 'alice' };
	expect(() => encodeBackup(unknown)).toThrow('INVALID_BACKUP');
	const scheduler = backupFixture(); Object.assign(scheduler.reviews[0], { schedulerVersion: 'ts-fsrs@99' });
	expect(() => encodeBackup(scheduler)).toThrow('INVALID_BACKUP');
	expect(() => decodeBackup(Buffer.from([0xff]))).toThrow('INVALID_BACKUP');
	expect(() => decodeBackup(Buffer.from('{'))).toThrow('INVALID_BACKUP');
	expect(() => decodeBackup(Buffer.alloc(MAX_BACKUP_BYTES + 1))).toThrow('BACKUP_TOO_LARGE');
});

test('identifies upstream binary and JSON v1–3 instead of pretending to restore their missing server snapshots', () => {
	expect(() => decodeBackup(Buffer.from('FUKUSHU-BACKUP-1\nanything'))).toThrow('UPSTREAM_BACKUP_UNSUPPORTED');
	for (const version of [1, 2, 3]) {
		expect(() => decodeBackup(Buffer.from(JSON.stringify({ format: 'gift-fsrs-learning-backup', version })))).toThrow('UPSTREAM_BACKUP_UNSUPPORTED');
	}
});

test('round trips the self-contained v2 format and verifies the asset bytes', async () => {
	const payload = mediaBackupFixture();
	const bytes = encodeBackup(payload);
	expect(JSON.parse(bytes.toString())).toMatchObject({ version: 2, payload: { media: payload.media } });
	expect(decodeBackup(bytes)).toEqual(payload);
	await expect(validateBackupMedia(decodeBackup(bytes))).resolves.toBeUndefined();
	expect(encodeBackup(decodeBackup(bytes))).toEqual(bytes);
});

test('rejects downgrade, missing media links and unreferenced attachments', () => {
	const source = mediaBackupFixture();
	const { media, ...noMedia } = source;
	expect(() => encodeBackup(noMedia)).toThrow('INVALID_BACKUP');
	expect(() => encodeBackup({ ...source, media: [] })).toThrow('INVALID_BACKUP');
	expect(() => encodeBackup({ ...source, media: [...media!, ...media!] })).toThrow('INVALID_BACKUP');
	expect(() => encodeBackup({ ...backupFixture(), media })).toThrow('INVALID_BACKUP');
	const bytes = encodeBackup(source);
	const envelope = JSON.parse(bytes.toString());
	expect(() => decodeBackup(Buffer.from(JSON.stringify({ ...envelope, version: 1 })))).toThrow('INVALID_BACKUP');
});

test('rejects fabricated bytes even if a backup checksum and all references agree', async () => {
	const payload = mediaBackupFixture();
	const [asset] = payload.media!;
	const fake = Buffer.from('not PCM wave');
	const id = createHash('sha256').update(fake).digest('hex');
	for (const card of [...payload.material.questions, ...payload.versions.map(v => v.data)]) {
		card.payload.ankiTemplate!.backHtml = card.payload.ankiTemplate!.backHtml.replace(asset.id, id);
	}
	payload.media = [{ ...asset, id, data: fake.toString('base64') }];
	await expect(validateBackupMedia(decodeBackup(encodeBackup(payload)))).rejects.toThrow('INVALID_BACKUP');
});
