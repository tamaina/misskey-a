/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mkdtempSync, chmodSync, existsSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../../../..');
const directory = mkdtempSync(join(tmpdir(), 'misskey-oauth-'));
chmodSync(directory, 0o700);
const socket = join(directory, 'redis.sock');
const container = `misskey-oauth-fixture-${randomUUID()}`;
const image = process.env.MISSKEY_OAUTH_REDIS_IMAGE ?? 'redis:8';
const { uid, gid } = userInfo();

function run(command, args, env = process.env) {
	const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
	if (result.error || result.status !== 0) throw new Error(`OAuth fixture command failed: ${command}`);
}

let started = false;
try {
	// A fresh Redis owns no network listeners or instance credentials/data.
	run('docker', ['run', '--detach', '--rm', '--name', container, '--network', 'none', '--user', `${uid}:${gid}`,
		'--mount', `type=bind,src=${directory},dst=/data`, image, 'redis-server', '--port', '0',
		'--unixsocket', '/data/redis.sock', '--unixsocketperm', '600', '--save', '', '--appendonly', 'no']);
	started = true;
	const deadline = Date.now() + 10000;
	while (!existsSync(socket) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
	if (!existsSync(socket)) throw new Error('Synthetic Redis socket did not become ready');
	run(process.execPath, ['--max-old-space-size=1536', 'packages/backend/node_modules/vitest/vitest.mjs', 'run',
		'--config', 'packages/features/auth/test/vitest.oauth-fixture.config.mjs'],
	{ ...process.env, NODE_ENV: 'test', MISSKEY_OAUTH_REDIS_SOCKET: socket });
} finally {
	if (started) run('docker', ['rm', '--force', container]);
	process.stdout.write(`Task-owned OAuth fixture retained at ${directory}; Redis container removed.\n`);
}
