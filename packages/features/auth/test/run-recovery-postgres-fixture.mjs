/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../../../..');
const versions = existsSync('/usr/lib/postgresql') ? readdirSync('/usr/lib/postgresql').sort((a, b) => Number(b) - Number(a)) : [];
const binaries = process.env.MISSKEY_PG_BINDIR ?? versions.map(version => `/usr/lib/postgresql/${version}/bin`).find(path => existsSync(join(path, 'initdb')));
if (!binaries) throw new Error('PostgreSQL fixture binaries unavailable; set MISSKEY_PG_BINDIR');
const directory = mkdtempSync('/tmp/misskey-auth-recovery-');
const data = join(directory, 'data');
const socket = join(directory, 'socket');
mkdirSync(socket, { mode: 0o700 });
writeFileSync(join(directory, '.misskey-auth-recovery-fixture'), 'auth_recovery_synthetic');

function run(binary, args, env = process.env) {
	const result = spawnSync(binary, args, { cwd: root, env, stdio: 'inherit' });
	if (result.error || result.status !== 0) throw new Error(`Recovery fixture command failed: ${binary}`);
}

let started = false;
let failure;
let cleanupFailure;
try {
	run(join(binaries, 'initdb'), ['-D', data, '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=reject', '--wal-segsize=1', '--no-sync']);
	const config = join(directory, 'settings.conf');
	writeFileSync(config, `data_directory = '${data}'\nlisten_addresses = ''\nport = 55437\nunix_socket_directories = '${socket}'\nunix_socket_permissions = 0700\nshared_buffers = '16MB'\nmax_connections = 6\nwork_mem = '1MB'\nmaintenance_work_mem = '16MB'\nmax_parallel_workers = 0\nmax_worker_processes = 1\nautovacuum = off\nfsync = off\nfull_page_writes = off\nstatement_timeout = '5s'\n`);
	started = true;
	run(join(binaries, 'pg_ctl'), ['-D', data, '-l', join(directory, 'server.log'), '-o', `-c config_file=${config}`, '-w', '-t', '10', 'start']);
	run(join(binaries, 'createdb'), ['-h', socket, '-p', '55437', '-U', userInfo().username, 'auth_recovery_synthetic']);
	const testConfig = join(directory, 'vitest.mjs');
	writeFileSync(testConfig, `import { baseConfig } from ${JSON.stringify(join(root, 'packages/backend/vitest.config.ts'))};\nexport default { ...baseConfig, test: { ...baseConfig.test, dir: ${JSON.stringify(join(root, 'packages/features/auth/test/backend'))}, include: ['recovery-code-postgres.test.ts'], environment: 'node', maxWorkers: 1, maxConcurrency: 1 } };\n`);
	run(process.execPath, ['--max-old-space-size=1024', 'packages/backend/node_modules/vitest/vitest.mjs', 'run', '--config', testConfig], { ...process.env, MISSKEY_AUTH_RECOVERY_TEST_SOCKET: socket });
} catch (error) {
	failure = { error };
} finally {
	if (started) {
		const status = spawnSync(join(binaries, 'pg_ctl'), ['-D', data, 'status'], { stdio: 'ignore' });
		if (status.status === 0) {
			const stopped = spawnSync(join(binaries, 'pg_ctl'), ['-D', data, '-m', 'fast', '-w', '-t', '10', 'stop'], { stdio: 'inherit' });
			if (stopped.error || stopped.status !== 0) cleanupFailure = new Error('Recovery fixture shutdown failed');
		} else if (status.status !== 3) {
			cleanupFailure = new Error('Cannot verify recovery fixture shutdown');
		}
	}
	process.stdout.write(`Task-owned recovery fixture retained at ${directory}; TCP disabled.\n`);
}

if (cleanupFailure) throw new AggregateError([...(failure ? [failure.error] : []), cleanupFailure], 'Recovery fixture shutdown was not verified');
if (failure) throw failure.error;
