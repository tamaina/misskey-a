/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '../../../..');
const binaries = process.env.MISSKEY_PG_BINDIR ?? '/usr/lib/postgresql/17/bin';
const directory = mkdtempSync(join(tmpdir(), 'misskey-mcp-'));
const data = join(directory, 'data');
const socket = join(directory, 'socket');
mkdirSync(socket, { mode: 0o700 });
writeFileSync(join(directory, '.misskey-mcp-fixture'), 'mcp_synthetic');

function run(command, args, env = process.env) {
	const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
	if (result.error || result.status !== 0) throw new Error(`Fixture command failed: ${command}`);
}

let started = false;
try {
	run(join(binaries, 'initdb'), ['-D', data, '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=reject', '--wal-segsize=1', '--no-sync']);
	const config = join(directory, 'settings.conf');
	writeFileSync(config, `data_directory = '${data}'\nlisten_addresses = ''\nport = 55436\nunix_socket_directories = '${socket}'\nunix_socket_permissions = 0700\nshared_buffers = '16MB'\nmax_connections = 6\nwork_mem = '1MB'\nmaintenance_work_mem = '16MB'\nmax_parallel_workers = 0\nmax_worker_processes = 1\nautovacuum = off\nfsync = off\nfull_page_writes = off\nstatement_timeout = '5s'\n`);
	run(join(binaries, 'pg_ctl'), ['-D', data, '-l', join(directory, 'server.log'), '-o', `-c config_file=${config}`, '-w', '-t', '10', 'start']);
	started = true;
	run(join(binaries, 'createdb'), ['-h', socket, '-p', '55436', '-U', userInfo().username, 'mcp_synthetic']);
	run(process.execPath, ['--max-old-space-size=1536', 'packages/backend/node_modules/vitest/vitest.mjs', 'run', '--config', 'packages/features/mcp/test/vitest.fixture.config.mjs'], { ...process.env, MISSKEY_MCP_TEST_DB: '1', MISSKEY_MCP_TEST_SOCKET: socket });
} finally {
	if (started) run(join(binaries, 'pg_ctl'), ['-D', data, '-m', 'fast', '-w', '-t', '10', 'stop']);
	process.stdout.write(`Task-owned fixture retained at ${directory}; TCP disabled.\n`);
}
