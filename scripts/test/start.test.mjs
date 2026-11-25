/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Exercise the production wrapper in an isolated checkout, without DB services.
function fixture(t, { compileFails = false, migrateFails = false } = {}) {
	const root = resolve(import.meta.dirname, '../..');
	const tempRoot = process.env.TMPDIR ?? join(root, '.tmp');
	mkdirSync(tempRoot, { recursive: true });
	const directory = mkdtempSync(join(tempRoot, 'start-contract-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	for (const path of ['scripts', 'packages/backend/scripts', 'packages/backend/built', 'packages/backend/node_modules/typeorm']) {
		mkdirSync(join(directory, path), { recursive: true });
	}
	copyFileSync(join(root, 'scripts/start.mjs'), join(directory, 'scripts/start.mjs'));
	writeFileSync(join(directory, 'packages/backend/package.json'), '{"type":"module"}');
	writeFileSync(join(directory, 'packages/backend/node_modules/typeorm/package.json'), '{"type":"module"}');
	const log = join(directory, 'steps.jsonl');
	const append = `import { appendFileSync, writeFileSync, readFileSync } from 'node:fs';\nconst log = ${JSON.stringify(log)};\nconst step = (name) => appendFileSync(log, JSON.stringify({ name, pid: process.pid, cwd: process.cwd(), value: process.env.START_TEST_VALUE }) + '\\n');\n`;
	writeFileSync(join(directory, 'packages/backend/scripts/compile_config.js'), append + `step('compile'); ${compileFails ? 'process.exit(23);' : ''} writeFileSync('built/.config.json', '{"compiled":true}');`);
	writeFileSync(join(directory, 'packages/backend/node_modules/typeorm/cli.js'), append + `step('migrate'); if (!JSON.parse(readFileSync('built/.config.json')).compiled) process.exit(1); ${migrateFails ? 'process.exit(24);' : ''}`);
	writeFileSync(join(directory, 'packages/backend/scripts/check_connect.js'), append + "step('connect'); if (!JSON.parse(readFileSync('built/.config.json')).compiled) process.exit(1);");
	writeFileSync(join(directory, 'packages/backend/built/entry.js'), append + "step('entry'); if (!JSON.parse(readFileSync('built/.config.json')).compiled) process.exit(1);");
	return {
		directory,
		run(args = []) {
			const result = spawnSync(process.execPath, args, { cwd: directory, env: { ...process.env, NODE_OPTIONS: '' }, encoding: 'utf8', timeout: 15000 });
			assert.ifError(result.error);
			return { result, steps: readFileSync(log, 'utf8').trim().split('\n').map(line => JSON.parse(line)) };
		},
	};
}

test('start compiles config before connectivity checks and the backend', t => {
	const { run, directory } = fixture(t);
	const { result, steps } = run(['scripts/start.mjs']);
	assert.equal(result.status, 0, result.stderr);
	assert.deepEqual(steps.map(step => step.name), ['compile', 'connect', 'entry']);
	assert.ok(steps.every(step => step.cwd === join(directory, 'packages/backend')));
	assert.notEqual(steps[0].pid, steps[2].pid);
});

test('migrateandstart compiles config before migration', t => {
	const { run } = fixture(t);
	const { result, steps } = run(['scripts/start.mjs', '--migrate']);
	assert.equal(result.status, 0, result.stderr);
	assert.deepEqual(steps.map(step => step.name), ['compile', 'migrate', 'connect', 'entry']);
});

test('config compilation failure prevents migration and backend launch', t => {
	const { run } = fixture(t, { compileFails: true });
	const { result, steps } = run(['scripts/start.mjs', '--migrate']);
	assert.equal(result.status, 23);
	assert.deepEqual(steps.map(step => step.name), ['compile']);
});

test('migration failure prevents backend launch', t => {
	const { run } = fixture(t, { migrateFails: true });
	const { result, steps } = run(['scripts/start.mjs', '--migrate']);
	assert.equal(result.status, 24);
	assert.deepEqual(steps.map(step => step.name), ['compile', 'migrate']);
});

test('relative Node option paths still resolve from the caller directory', t => {
	const { run, directory } = fixture(t);
	writeFileSync(join(directory, 'caller.env'), 'START_TEST_VALUE=from-caller\n');
	const { result, steps } = run(['--env-file=caller.env', 'scripts/start.mjs']);
	assert.equal(result.status, 0, result.stderr);
	assert.ok(steps.every(step => step.value === 'from-caller'));
});
