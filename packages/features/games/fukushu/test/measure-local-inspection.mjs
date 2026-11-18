/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// From packages/frontend: node --import tsx ../features/games/fukushu/test/measure-local-inspection.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { openAsBlob } from 'node:fs';
import { mkdtemp, open, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectLocalUpstream } from '../frontend/upstream-local.ts';
import { inspectUpstreamBytes } from '../shared/upstream-reader.ts';

const writerFixture = new URL('./backend/fixtures/upstream-backup.fukushu', import.meta.url);
const magic = Buffer.from('FUKUSHU-BACKUP-1\n');

async function generate(path, cards, mediaMiB) {
	const sample = await readFile(writerFixture);
	const out = await open(path, 'wx');
	const digest = createHash('sha256');

	async function writePayload(bytes) {
		digest.update(bytes);
		await out.writeFile(bytes);
	}

	async function frame(row) {
		const json = Buffer.from(JSON.stringify(row));
		const length = Buffer.alloc(4);
		length.writeUInt32LE(json.length);
		await writePayload(length);
		await writePayload(json);
	}

	try {
		await writePayload(magic);
		let question;
		let state;
		for (let pos = magic.length; pos < sample.length - 64;) {
			const size = sample.readUInt32LE(pos);
			pos += 4;
			const row = JSON.parse(sample.toString('utf8', pos, pos + size));
			pos += size;
			if (row.store === 'decks') Object.assign(row.value, { questionCount: cards, enabledQuestionCount: cards });
			if (row.store === 'questions' && row.value.kind === 'multiple-choice') question = row.value;
			if (row.store === 'studyStates') state = row.value;
			await frame(row);
			if (row.blobSize) await writePayload(sample.subarray(pos, pos + row.blobSize));
			pos += row.blobSize ?? 0;
		}
		assert.ok(question && state);
		for (let i = 2; i < cards; i++) {
			const id = 'anki:scale:' + i;
			await frame({ store: 'questions', value: { ...question, id, sourceKey: id, sourceOrder: i + 10, payload: { ...question.payload, id, sourceKey: id } } });
			await frame({ store: 'studyStates', value: { ...state, questionId: id } });
		}
		const chunk = Buffer.alloc(1024 ** 2);
		const mediaHash = createHash('sha256');
		for (let i = 0; i < mediaMiB; i++) mediaHash.update(chunk);
		const size = mediaMiB * chunk.length;
		await frame({ store: 'media', value: { id: mediaHash.digest('hex'), blobBase64: '', mimeType: 'application/octet-stream', size }, blobSize: size });
		for (let i = 0; i < mediaMiB; i++) await writePayload(chunk);
		await out.writeFile(digest.digest('hex'));
	} finally { await out.close(); }
}

if (process.argv[2]) {
	const [mode, path] = process.argv.slice(2);
	const file = Object.assign(await openAsBlob(path), { name: 'scale.fukushu' });
	const start = performance.now();
	const report = mode === 'local' ? await inspectLocalUpstream(file) :
		await inspectUpstreamBytes(new Uint8Array(await file.arrayBuffer()), async value => Buffer.from(await crypto.subtle.digest('SHA-256', new Uint8Array(value))).toString('hex'));
	console.log(JSON.stringify({ mode, bytes: file.size, questions: report.counts.questions, sha256: report.sha256, seconds: (performance.now() - start) / 1000, peakRssKiB: process.resourceUsage().maxRSS }));
} else {
	const dir = await mkdtemp(join(tmpdir(), 'fukushu-measure-'));
	try {
		for (const [cards, mediaMiB] of [[500, 6], [5000, 32], [5000, 128], [5000, 600]]) {
			const path = join(dir, mediaMiB + '.fukushu');
			await generate(path, cards, mediaMiB);
			const modes = mediaMiB === 6 ? ['snapshot', 'local'] : ['local'];
			let previous;
			for (const mode of modes) {
				const result = JSON.parse(execFileSync(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), mode, path], { encoding: 'utf8' }));
				assert.equal(result.questions, cards);
				if (previous) assert.equal(result.sha256, previous.sha256);
				previous = result;
				console.log(JSON.stringify(result));
			}
			await rm(path);
		}
	} finally { await rm(dir, { recursive: true, force: true }); }
}
