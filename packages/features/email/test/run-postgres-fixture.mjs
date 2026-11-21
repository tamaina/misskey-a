/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '../../../..');
const versions = existsSync('/usr/lib/postgresql') ? readdirSync('/usr/lib/postgresql').sort((a, b) => Number(b) - Number(a)) : [];
const binaries = process.env.MISSKEY_PG_BINDIR ?? versions.map(version => `/usr/lib/postgresql/${version}/bin`).find(path => existsSync(join(path, 'initdb')));
if (!binaries) throw new Error('PostgreSQL fixture binaries unavailable; set MISSKEY_PG_BINDIR');
const directory = mkdtempSync(join(tmpdir(), 'misskey-mail-'));
const data = join(directory, 'data');
const socket = join(directory, 'socket');
mkdirSync(socket, { mode: 0o700 });
writeFileSync(join(directory, '.misskey-mail-fixture'), 'mail_synthetic');

function run(command, args, env = process.env) {
	const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
	if (result.error || result.status !== 0) throw new Error(`Fixture command failed: ${command}`);
}

let started = false;
try {
	run(join(binaries, 'initdb'), ['-D', data, '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=reject', '--wal-segsize=1', '--no-sync']);
	const config = join(directory, 'settings.conf');
	writeFileSync(config, `data_directory = '${data}'\nlisten_addresses = ''\nport = 55438\nunix_socket_directories = '${socket}'\nunix_socket_permissions = 0700\nshared_buffers = '16MB'\nmax_connections = 12\nwork_mem = '1MB'\nmaintenance_work_mem = '16MB'\nmax_parallel_workers = 0\nmax_worker_processes = 1\nautovacuum = off\nfsync = off\nfull_page_writes = off\nstatement_timeout = '5s'\n`);
	run(join(binaries, 'pg_ctl'), ['-D', data, '-l', join(directory, 'server.log'), '-o', `-c config_file=${config}`, '-w', '-t', '10', 'start']);
	started = true;
	run(join(binaries, 'createdb'), ['-h', socket, '-p', '55438', '-U', userInfo().username, 'mail_synthetic']);
	const connection = new URL('postgresql:///mail_synthetic');
	connection.searchParams.set('host', socket);
	connection.searchParams.set('port', '55438');
	connection.searchParams.set('user', userInfo().username);
	run(process.execPath, ['--max-old-space-size=1536', '--test', '--test-concurrency=1', 'packages/features/email/test/store.test.mjs', 'packages/features/email/test/submission.test.mjs'], { ...process.env, MAIL_TEST_DATABASE_URL: connection.href });
} finally {
	if (started) run(join(binaries, 'pg_ctl'), ['-D', data, '-m', 'fast', '-w', '-t', '10', 'stop']);
	process.stdout.write(`Task-owned fixture retained at ${directory}; TCP disabled.\n`);
}
