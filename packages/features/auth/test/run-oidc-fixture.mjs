/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const directory = mkdtempSync('/tmp/misskey-oidc-fixture-');
const container = `misskey-oidc-fixture-${randomUUID()}`;
const socket = `${directory}/redis.sock`;
const command = (binary, args, options = {}) => {
	const result = spawnSync(binary, args, { cwd: root, stdio: 'inherit', ...options });
	if (result.error || result.status !== 0) throw new Error(`OIDC fixture command failed: ${binary}`);
};
let started = false;

try {
	// An existing image is required; this command never downloads or installs dependencies.
	command('docker', ['image', 'inspect', 'redis:8'], { stdio: 'ignore' });
	started = true;
	command('docker', ['run', '--detach', '--pull', 'never', '--name', container,
		'--network', 'none', '--cpus', '1', '--memory', '128m', '--cap-drop', 'ALL',
		'--user', `${process.getuid()}:${process.getgid()}`,
		'--mount', `type=bind,src=${directory},dst=/fixture`, 'redis:8',
		'redis-server', '--port', '0', '--unixsocket', '/fixture/redis.sock',
		'--unixsocketperm', '700', '--save', '', '--appendonly', 'no', '--dir', '/fixture']);
	let ready = false;
	for (let attempt = 0; attempt < 20; attempt++) {
		const ping = spawnSync('docker', ['exec', container, 'redis-cli', '-s', '/fixture/redis.sock', 'ping'], { encoding: 'utf8' });
		if (ping.status === 0 && ping.stdout.trim() === 'PONG') {
			ready = true;
			break;
		}
		await new Promise(resolve => setTimeout(resolve, 50));
	}
	if (!ready) throw new Error('OIDC fixture Redis did not become ready');
	const config = `${directory}/vitest.mjs`;
	writeFileSync(config, `import { baseConfig } from ${JSON.stringify(resolve(root, 'packages/backend/vitest.config.ts'))};
export default { ...baseConfig, test: { ...baseConfig.test,
include: ['../features/auth/test/backend/oidc-flow-store.test.ts', '../features/auth/test/backend/oidc-discovery.test.ts', '../features/auth/test/backend/oidc-transaction-store.test.ts', '../features/auth/test/backend/client-metadata-fetcher.test.ts'], environment: 'node', maxWorkers: 1 } };`);
	command(process.execPath, ['packages/backend/node_modules/vitest/vitest.mjs', 'run', '--config', config], {
		env: { ...process.env, MISSKEY_OIDC_REDIS_SOCKET: socket },
	});
} finally {
	if (started) spawnSync('docker', ['rm', '--force', container], { stdio: 'ignore' });
	rmSync(directory, { recursive: true, force: true });
}
