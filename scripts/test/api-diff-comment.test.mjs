/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Execute the exact inline workflow renderer. No checkout/dependency is added to
// the privileged workflow; downloaded artifact content is only text input.
const workflow = readFileSync(new URL('../../.github/workflows/report-api-diff.yml', import.meta.url), 'utf8');
const match = workflow.match(/node --input-type=module <<'NODE'\n([\s\S]*?)^          NODE$/m);
assert.ok(match, 'Inline renderer exists');
const program = match[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
const artifact = 'https://github.com/owner/repo/actions/runs/123/artifacts/456';

function render(diff, { missingArtifact = false, missingDiff = false } = {}) {
	const directory = mkdtempSync(join(tmpdir(), 'api-diff-comment-'));
	try {
		if (!missingDiff) writeFileSync(join(directory, 'api.json.diff'), diff);
		writeFileSync(join(directory, 'api-full.json.diff'), 'Synthetic full review evidence');
		const result = spawnSync(process.execPath, ['--input-type=module', '-e', program], { cwd: directory, encoding: 'utf8', env: { ...process.env, DIFF_ARTIFACT_URL: missingArtifact ? '' : artifact, GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '123' } });
		if (result.error) throw result.error;
		const body = existsSync(join(directory, 'output.md')) ? readFileSync(join(directory, 'output.md'), 'utf8') : null;
		assert.equal(readFileSync(join(directory, 'api-full.json.diff'), 'utf8'), 'Synthetic full review evidence');
		if (!missingDiff) assert.equal(readFileSync(join(directory, 'api.json.diff'), 'utf8'), diff);
		if (body !== null) {
			assert.ok(Buffer.byteLength(body) <= 60 * 1024);
			assert.ok(body.length < 65536);
			assert.ok(body.includes(artifact));
			assert.ok(body.includes('https://github.com/owner/repo/actions/runs/123'));
		}
		return { body, status: result.status, error: result.stderr };
	} finally { rmSync(directory, { recursive: true, force: true }); }
}

test('empty diff preserves evidence link without an empty details block', () => {
	const result = render(''); assert.equal(result.status, 0);
	assert.match(result.body, /差分はありません/); assert.doesNotMatch(result.body, /<details>/);
});
test('small diff is complete, counted without headers and closes details correctly', () => {
	const diff = '--- base\n+++ head\n@@ -1 +1 @@\n-old\n+new\n';
	const result = render(diff); assert.equal(result.status, 0);
	assert.ok(result.body.includes(diff)); assert.match(result.body, /1 追加行 \/ 1 削除行/);
	assert.equal((result.body.match(/<details>/g) ?? []).length, 1); assert.equal((result.body.match(/<\/details>/g) ?? []).length, 1);
});
test('oversized diff is summarized and linked while all local evidence remains intact', () => {
	const result = render('--- base\n+++ head\n' + '+synthetic new operation\n'.repeat(20000)); assert.equal(result.status, 0);
	assert.match(result.body, /20000 追加行 \/ 0 削除行/); assert.match(result.body, /省略あり/);
});
test('UTF-8 multibyte and astral characters truncate without corrupting text', () => {
	const result = render('+日本語🐱'.repeat(20000)); assert.equal(result.status, 0);
	assert.doesNotMatch(result.body, /\uFFFD/); assert.match(result.body, /省略あり/);
});
test('a huge single backtick line stays fenced and cannot exceed comment bound', () => {
	const result = render('+' + '`'.repeat(100000)); assert.equal(result.status, 0);
	const opening = result.body.match(/(`+)diff\n/)[1]; assert.ok(opening.length > 8000);
	assert.ok(result.body.includes('\n' + opening + '\n</details>'));
});
test('missing artifact link or diff still fails instead of hiding lost evidence', () => {
	for (const options of [{ missingArtifact: true }, { missingDiff: true }]) {
		const result = render('+test', options); assert.notEqual(result.status, 0); assert.equal(result.body, null);
	}
});
