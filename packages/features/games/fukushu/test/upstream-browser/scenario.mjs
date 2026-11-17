/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global document, window */
// Test-only aliases resolve to an unmodified, pinned tamaina/fukushu checkout.
import { previewApkg } from 'upstream/application/importApkg';
import { applyApkg, prepareApkg } from 'upstream/application/apkgStore';
import { previewGift } from 'upstream/application/importGift';
import { saveNewDeck, updateDeck } from 'upstream/application/decks';
import { buildStudyQueue, recordReview } from 'upstream/application/study';
import { database, settingsRepository } from 'upstream/infrastructure/db/database';
import { createBackupArchive, restoreBackupFile } from 'upstream/application/backupArchive';

const assert = (ok, message) => { if (!ok) throw new Error(message); };
const bytes = async (blob) => Array.from(new Uint8Array(await blob.arrayBuffer()));
const snapshot = async () => {
	const db = await database();
	return Object.fromEntries(await Promise.all(Array.from(db.objectStoreNames).map(async store => [store, await db.getAll(store)])));
};

export async function generate() {
	const input = document.querySelector('#fixture');
	const file = input.files?.[0];
	assert(file, 'Choose the official synthetic APKG fixture');
	const db = await database();
	assert((await db.count('decks')) === 0, 'Generator requires an empty, disposable browser context');
	await settingsRepository.put({ ...await settingsRepository.get(), desiredRetention: 0.87 });
	const apkg = await previewApkg(file);
	await applyApkg(await prepareApkg(apkg, file.name, true));
	const imported = await snapshot();
	assert(imported.questions.length === 9 && imported.reviewLogs.length === 36, 'Official 21b fixture did not produce 9 cards / 36 Anki logs');
	assert(imported.reviewLogs.every(row => row.id.startsWith('anki:')), 'APKG history IDs must come from upstream import');
	const deckId = crypto.randomUUID();
	await saveNewDeck('Compatibility reset example', await previewGift('::stable-name:: Sky is blue. {TRUE}', deckId), 'synthetic.gift');
	const clock = { now: () => new Date('2026-11-17T13:00:00.000Z') };
	const item = (await buildStudyQueue(clock, deckId, true))[0];
	await recordReview(item, 'good', true, [], 1200, clock);
	const before = await db.get('studyStates', item.question.id);
	await updateDeck(deckId, await previewGift('::stable-name:: Sky is blue. {FALSE}', deckId));
	const after = await db.get('studyStates', item.question.id);
	const history = await db.getAllFromIndex('reviewLogs', 'by-question', item.question.id);
	assert(before?.card.reps === 1 && after?.card.reps === 0 && history.length === 1, 'Actual updateDeck reset must retain the review');
	const archive = await createBackupArchive();
	const original = await bytes(archive);
	await restoreBackupFile(archive); // Only this fresh context's disposable IndexedDB.
	const roundtrip = await bytes(await createBackupArchive());
	assert(JSON.stringify(original) === JSON.stringify(roundtrip), 'Upstream own export/import must preserve archive bytes');
	return { archive: original, resetQuestionId: item.question.id, report: {
		apkg: file.name, apkgCards: 9, ankiLogs: 36, reset: { beforeReps: before.card.reps, afterReps: after.card.reps, logs: history.length },
		desiredRetention: 0.87, upstreamRoundtripByteIdentical: true,
	} };
}

export async function restoreAndContinue(raw, questionId, reviewedAt = '2026-11-18T13:00:00.000Z', rating = 'easy') {
	await restoreBackupFile(new Blob([new Uint8Array(raw)]));
	const state = await (await database()).get('studyStates', questionId);
	const logs = await (await database()).getAll('reviewLogs');
	const clock = { now: () => new Date(reviewedAt) };
	const item = (await buildStudyQueue(clock, undefined, true)).find(row => row.question.id === questionId);
	assert(item, 'Transferred question must remain studyable in upstream');
	await recordReview(item, rating, true, ['continued'], 500, clock);
	const nextState = await (await database()).get('studyStates', questionId);
	const newLogs = (await (await database()).getAll('reviewLogs')).filter(row => !logs.some(old => old.id === row.id));
	return { before: state, after: nextState, record: newLogs[0], logCountBefore: logs.length, logCountAfter: await (await database()).count('reviewLogs'), archive: await bytes(await createBackupArchive()) };
}
Object.assign(window, { compatibility: { generate, restoreAndContinue } });
