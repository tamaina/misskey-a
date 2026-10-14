/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mkdtempSync, chmodSync, existsSync } from 'node:fs';
import { userInfo } from 'node:os';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../../../..');
const directory = mkdtempSync('/tmp/misskey-oauth-'); chmodSync(directory, 0o700);
const socket = join(directory, 'redis.sock');
const container = `misskey-fresh-password-${randomUUID()}`;
const { uid, gid } = userInfo();

function run(command, args, env = process.env) {
	const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
	if (result.error || result.status !== 0) throw new Error(`Fresh password fixture command failed: ${command}`);
}

let started = false;
try {
	// Use an existing image, no network listeners, grants or shared services.
	run('docker', ['run', '--detach', '--pull', 'never', '--name', container, '--network', 'none', '--memory', '128m', '--cpus', '1', '--user', `${uid}:${gid}`,
		'--mount', `type=bind,src=${directory},dst=/data`, 'redis:8', 'redis-server', '--port', '0', '--unixsocket', '/data/redis.sock', '--unixsocketperm', '600', '--save', '', '--appendonly', 'no']);
	started = true;
	const deadline = Date.now() + 10000;
	while (!existsSync(socket) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
	if (!existsSync(socket)) throw new Error('Fresh password fixture Redis unavailable');
	run(process.execPath, ['packages/features/auth/test/run-mfa-policy-postgres-fixture.mjs'], { ...process.env, MISSKEY_AUTH_PASSWORD_CHANGE_FIXTURE: '1', MISSKEY_OAUTH_REDIS_SOCKET: socket });
} finally {
	if (started) run('docker', ['rm', '--force', container]);
	process.stdout.write(`Task-owned fresh password fixture retained at ${directory}; Redis removed.\n`);
}
