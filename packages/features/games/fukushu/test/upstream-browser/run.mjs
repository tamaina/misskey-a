/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global window */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const upstream = resolve(process.env.FUKUSHU_UPSTREAM);
const deps = resolve(process.env.FUKUSHU_BROWSER_DEPS);
const out = resolve(process.env.FUKUSHU_BROWSER_OUTPUT);
const require = createRequire(join(deps, 'package.json'));
const { build } = await import(pathToFileURL(process.env.ESBUILD_MODULE));
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const pinned = '0efee271a13f15096beb8cbaaea25092c5927b29';
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(), pinned);
assert.equal(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: upstream, encoding: 'utf8' }).trim(), '');
await mkdir(out, { recursive: true });
const files = new Map();
const aliases = {
	'@fukushu/anki-import': 'packages/anki-import/src/index.ts',
	'@fukushu/anki-import/archive': 'packages/anki-import/src/archive.ts',
	'@fukushu/anki-import/safety': 'packages/anki-import/src/safety.ts',
	'@fukushu/gift-parser': 'packages/gift-parser/src/index.ts',
};
const resolver = { name: 'pinned-upstream', setup(api) {
	api.onResolve({ filter: /\?url$/ }, args => ({ path: args.path, namespace: 'asset' }));
	api.onLoad({ filter: /.*/, namespace: 'asset' }, () => ({ contents: 'export default "/sql-wasm.wasm"', loader: 'js' }));
	api.onResolve({ filter: /^[^./]/ }, async args => {
		if (args.pluginData?.resolved) return;
		if (args.path.startsWith('upstream/')) return { path: join(upstream, 'packages/app/src', args.path.slice(9) + '.ts') };
		if (aliases[args.path]) return { path: join(upstream, aliases[args.path]) };
		if (args.path.startsWith('node:') || ['fs', 'path', 'crypto', 'module'].includes(args.path)) return { path: args.path, external: true };
		return api.resolve(args.path, { resolveDir: args.importer.includes('node_modules') ? args.resolveDir : deps, kind: args.kind, pluginData: { resolved: true } });
	});
} };
for (const [url, entry] of [['/scenario.js', join(here, 'scenario.mjs')], ['/apkg.worker.ts', join(upstream, 'packages/app/src/application/apkg.worker.ts')]]) {
	const bundle = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'browser', format: 'esm', plugins: [resolver], logLevel: 'warning' });
	files.set(url, { body: bundle.outputFiles[0].contents, type: 'text/javascript' });
}
files.set('/sql-wasm.wasm', { body: await readFile(require.resolve('sql.js/dist/sql-wasm.wasm')), type: 'application/wasm' });
files.set('/', { body: '<!doctype html><title>Disposable upstream compatibility test</title><input id="fixture" type="file"><script type="module" src="/scenario.js"></script>', type: 'text/html' });
// Build the unregistered 9k adapter before starting Chrome (no overlapping build/browser work).
for (const [entry, output] of [['../../backend/pilot/upstream-session.ts', 'session.mjs'], ['../../shared/upstream-reader.ts', 'reader.mjs']]) {
const adapter = join(here, entry);
await build({ entryPoints: [adapter], outfile: join(out, output), bundle: true, platform: 'node', format: 'esm', packages: 'bundle', plugins: [{ name: 'private-deps', setup(api) {
	api.onResolve({ filter: /^[^./]/ }, async args => {
		if (args.path.startsWith('node:') || args.pluginData?.resolved) return;
		return api.resolve(args.path, { resolveDir: args.importer.includes('node_modules') ? args.resolveDir : deps, kind: args.kind, pluginData: { resolved: true } });
	});
} }], logLevel: 'warning' });
}
const { UpstreamCompatibilitySession } = await import(pathToFileURL(join(out, 'session.mjs')));
const server = createServer((req, res) => {
	const file = files.get(req.url);
	res.writeHead(file ? 200 : 404, { 'Content-Type': file?.type ?? 'text/plain' });
	res.end(file?.body ?? 'Not found');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
	browser = await chromium.launch({ channel: 'chrome', chromiumSandbox: true, headless: true });
	const context = await browser.newContext();
	const page = await context.newPage();
	page.on('pageerror', error => console.error(error));
	await page.goto(`http://127.0.0.1:${server.address().port}/`);
	await page.waitForFunction(() => window.compatibility);
	const large = process.env.FUKUSHU_LONG_HISTORY === 'generate-large';
	if (process.env.FUKUSHU_TODAY === 'verify') {
		const saved = JSON.parse(await readFile(process.env.FUKUSHU_PERSISTED_STATE, 'utf8'));
		await page.locator('#fixture').setInputFiles(process.env.FUKUSHU_PERSISTED_EXPORT);
		const { questions, settings, logs } = await page.evaluate(at => window.compatibility.today(at), saved.at);
		assert.deepEqual(settings, saved.settings);
		assert.deepEqual(logs, [saved.record]);
		assert.deepEqual(questions, saved.questions);
		console.log(JSON.stringify({ upstream: pinned, chrome: browser.version(), matched: questions.length, settings, reviews: logs.length }));
	} else if (process.env.FUKUSHU_NEW_GIFT === 'verify') {
		const saved = JSON.parse(await readFile(process.env.FUKUSHU_PERSISTED_STATE, 'utf8'));
		await page.locator('#fixture').setInputFiles(process.env.FUKUSHU_PERSISTED_EXPORT);
		const result = await page.evaluate(input => window.compatibility.verifyNewGift(input), saved);
		assert.deepEqual(result.state, saved.state);
		assert.deepEqual(result.log, saved.record);
		assert.deepEqual(result.from9k, result.fromGift);
		assert.equal(result.sourceText, saved.source);
		assert.equal(result.sourceFileName, 'biology.gift.txt');
		assert.equal(result.from9k.length, 2);
		assert.equal(result.preserved, true);
		assert.equal(result.reps, saved.state.card.reps + 1);
		assert.equal(result.count, 2);
		console.log(JSON.stringify({ upstream: pinned, chrome: browser.version(), sourceFileName: result.sourceFileName, questions: result.from9k.length, preserved: result.preserved, reps: result.reps, reviewCount: result.count, reexportBytes: result.bytes }));
	} else if (large || process.env.FUKUSHU_LONG_HISTORY === 'generate') {
		await page.locator('#fixture').setInputFiles(join(here, '../backend/fixtures/actual-upstream/actual-upstream.fukushu'));
		const download = page.waitForEvent('download');
		const result = await page.evaluate(large => window.compatibility.longHistory(undefined, large), large);
		await (await download).saveAs(join(out, 'long-input.fukushu'));
		assert.equal(result.logs, 9999);
		assert(result.bytes > (large ? 64 : 8) * 1024 ** 2);
		if (!large) assert(result.bytes < 30 * 1024 ** 2);
		console.log(JSON.stringify({ ...result, upstream: pinned, chrome: browser.version() }));
	} else if (process.env.FUKUSHU_LONG_HISTORY === 'verify') {
		const saved = JSON.parse(await readFile(process.env.FUKUSHU_PERSISTED_STATE, 'utf8'));
		await page.locator('#fixture').setInputFiles(process.env.FUKUSHU_PERSISTED_EXPORT);
		const result = await page.evaluate(saved => window.compatibility.longHistory(saved), saved);
		assert.deepEqual(result.before, saved.state);
		assert.equal(result.previous, 10001);
		assert.equal(result.logs, 10002);
		assert.equal(result.state.card.reps, saved.state.card.reps + 1);
		assert.equal(result.preserved, true);
		console.log(JSON.stringify({ ...result, upstream: pinned, chrome: browser.version() }));
	} else if (process.env.FUKUSHU_PERSISTED_EXPORT) {
		// Explicit test artifact from full-app-http in its fresh, isolated owner DB.
		const archive = await readFile(process.env.FUKUSHU_PERSISTED_EXPORT);
		const session = await UpstreamCompatibilitySession.open(archive);
		const before = session.snapshot();
		const saved = JSON.parse(await readFile(process.env.FUKUSHU_PERSISTED_STATE, 'utf8'));
		assert.deepEqual(before.studyStates.find(row => row.questionId === saved.state.questionId), saved.state);
		assert.equal(before.reviewLogs.length, 38);
		assert.equal(before.reviewLogs.filter(row => row.id.startsWith('anki:')).length, 36);
		const continued = await page.evaluate(({ raw, id, at }) => window.compatibility.restoreAndContinue(raw, id, at), {
			raw: Array.from(archive), id: saved.state.questionId,
			at: new Date(Date.parse(saved.record.reviewedAt) + 86400000).toISOString(),
		});
		assert.deepEqual(continued.before, saved.state);
		assert.equal(continued.after.card.reps, saved.state.card.reps + 1);
		assert.equal(continued.logCountBefore, 38); assert.equal(continued.logCountAfter, 39);
		const returned = await UpstreamCompatibilitySession.open(new Uint8Array(continued.archive));
		for (const store of ['decks', 'questions', 'settings', 'importSources', 'media', 'imports']) assert.deepEqual(returned.snapshot()[store], before[store]);
		for (const row of before.reviewLogs) assert.deepEqual(returned.snapshot().reviewLogs.find(log => log.id === row.id), row);
		// Read the source framing as well: normalized records intentionally omit binary payloads.
		const { readUpstreamArchive } = await import(pathToFileURL(join(out, 'reader.mjs')));
		const sha = async bytes => createHash('sha256').update(bytes).digest('hex');
		const sourceFrames = (await readUpstreamArchive(archive, sha)).frames();
		const returnedFrames = (await readUpstreamArchive(new Uint8Array(continued.archive), sha)).frames();
		assert.deepEqual(returnedFrames.filter(row => row.blob !== undefined), sourceFrames.filter(row => row.blob !== undefined));
		await writeFile(join(out, 'persisted-return-to-upstream.fukushu'), new Uint8Array(continued.archive));
		const report = { upstreamCommit: pinned, chrome: browser.version(), chromiumSandbox: true, realIndexedDB: true, syntheticDataOnly: true, persistedExportSha256: createHash('sha256').update(archive).digest('hex'), originalLogsUnchanged: 38, finalLogCount: 39, beforeReps: saved.state.card.reps, afterReps: continued.after.card.reps, binaryPreserved: true };
		await writeFile(join(out, 'persisted-provenance.json'), JSON.stringify(report, null, 2) + '\n');
		console.log(JSON.stringify(report));
	} else {
		const fixture = join(upstream, 'packages/anki-import/tests/fixtures/official-21b.apkg');
		await page.locator('#fixture').setInputFiles(fixture);
		const generated = await page.evaluate(() => window.compatibility.generate());
		const archive = Buffer.from(generated.archive);
		await writeFile(join(out, 'actual-upstream.fukushu'), archive);
		const session = await UpstreamCompatibilitySession.open(archive);
		assert.deepEqual(session.export(), new Uint8Array(archive));
		const before = session.snapshot();
		// Genuine non-UUID IDs are retained; local optimistic counters start at zero independently.
		assert.equal(before.reviewLogs.filter(row => row.id.startsWith('anki:')).length, 36);
		const request = { requestId: '36da1285-9941-4b4d-ad17-55c19c38eca5', questionId: generated.resetQuestionId, expectedRevision: 0, rating: 'easy', correct: true, answers: ['continued'], durationMs: 500, reviewedAt: '2026-11-18T13:00:00.000Z' };
		const expected = await page.evaluate(({ raw, id, at }) => window.compatibility.restoreAndContinue(raw, id, at), { raw: generated.archive, id: generated.resetQuestionId, at: request.reviewedAt });
		const result = await session.recordReview(request);
		assert.deepEqual(result.state, expected.after);
		assert.deepEqual({ ...result.record, id: expected.record.id }, expected.record);
		assert.equal(result.revision, 1);
		assert.equal(result.state.card.reps, 1);
		assert.deepEqual(session.snapshot().reviewLogs.slice(0, before.reviewLogs.length), before.reviewLogs);
		// Continue an APKG card from its current imported FSRS state as well as the reset card.
		const apkgQuestion = before.reviewLogs.find(row => row.id.startsWith('anki:')).questionId;
		const apkgRequest = { ...request, requestId: 'c5e772eb-78e7-44b1-8cdb-736dff7a270b', questionId: apkgQuestion };
		const apkgExpected = await page.evaluate(({ raw, id, at }) => window.compatibility.restoreAndContinue(raw, id, at), { raw: Array.from(session.export()), id: apkgQuestion, at: request.reviewedAt });
		const apkgResult = await session.recordReview(apkgRequest);
		assert.deepEqual(apkgResult.state, apkgExpected.after);
		assert.deepEqual({ ...apkgResult.record, id: apkgExpected.record.id }, apkgExpected.record);
		assert.equal(apkgResult.revision, 1);
		assert.equal(apkgResult.state.card.reps, apkgExpected.before.card.reps + 1);
		await writeFile(join(out, 'expected-continuation.json'), JSON.stringify({ reset: { request, result }, apkg: { request: apkgRequest, result: apkgResult } }, null, 2) + '\n');
		const after = session.export();
		assert.deepEqual(await session.recordReview(request), result);
		assert.deepEqual(session.export(), after);
		await assert.rejects(session.recordReview({ ...request, rating: 'hard' }), { code: 'REQUEST_CONFLICT' });
		const continued = await page.evaluate(({ raw, id }) => window.compatibility.restoreAndContinue(raw, id, '2026-11-19T13:00:00.000Z'), { raw: Array.from(after), id: generated.resetQuestionId });
		assert.deepEqual(continued.before, result.state);
		assert.equal(continued.logCountBefore, before.reviewLogs.length + 2);
		assert.equal(continued.logCountAfter, before.reviewLogs.length + 3);
		const returned = await UpstreamCompatibilitySession.open(new Uint8Array(continued.archive));
		for (const store of ['decks', 'questions', 'settings', 'importSources', 'media', 'imports']) assert.deepEqual(returned.snapshot()[store], before[store]);
		assert.deepEqual(returned.snapshot().studyStates.find(row => row.questionId === generated.resetQuestionId), continued.after);
		for (const row of before.reviewLogs) assert.deepEqual(returned.snapshot().reviewLogs.find(log => log.id === row.id), row);
		await writeFile(join(out, 'after-9k.fukushu'), after);
		await writeFile(join(out, 'after-return-to-upstream.fukushu'), new Uint8Array(continued.archive));
		const report = { continuation: { nineKMatchesUpstreamStateAndLog: true, originalLogsUnchanged: before.reviewLogs.length, retryIdempotent: true, returnedToUpstream: true, finalLogCount: continued.logCountAfter, finalReps: continued.after.card.reps, apkgBeforeReps: apkgExpected.before.card.reps, apkgAfterReps: apkgResult.state.card.reps }, upstreamCommit: pinned, chrome: browser.version(), chromiumSandbox: true, realIndexedDB: true, syntheticDataOnly: true, apkgSha256: createHash('sha256').update(await readFile(fixture)).digest('hex'), backupSha256: createHash('sha256').update(archive).digest('hex'), resetQuestionId: generated.resetQuestionId, ...generated.report };
		await writeFile(join(out, 'provenance.json'), JSON.stringify(report, null, 2) + '\n');
		console.log(JSON.stringify(report));
	}
} finally {
	await browser?.close();
	await new Promise(resolve => server.close(resolve));
}
