/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { loadConfig } from '../../built/config.js';
import { createPostgresDataSource } from '../../built/postgres.js';

const config = loadConfig();
assert.equal(process.env.NODE_ENV, 'test');
assert.equal(config.db.host, '127.0.0.1'); assert.equal(config.db.port, 54312);
assert.equal(config.db.db, 'test-misskey'); assert.equal(config.clusterLimit, 1);
assert.equal(config.redis.host, '127.0.0.1'); assert.equal(config.redis.port, 56312);
const db = createPostgresDataSource(config);
before(async () => {
	await db.initialize();
	await db.getRepository('MiMeta').save({ id: 'x', enableServerMachineStats: false });
});
after(async () => { if (db.isInitialized) await db.destroy(); });

for (const mode of ['server', 'queue', 'combined', 'cluster', 'cluster-server', 'cluster-queue']) {
	test(`${mode} reaches readiness and drains on SIGTERM without the process deadline`, { timeout: 90000 }, async () => {
		let output = '';
		const child = spawn(process.execPath, ['built/entry.js'], {
			cwd: new URL('../../', import.meta.url), detached: true,
			stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
			env: { ...process.env, NODE_ENV: 'development', MK_DISABLE_CLUSTERING: mode.startsWith('cluster') ? '' : '1', MK_ONLY_SERVER: mode.endsWith('server') ? '1' : '', MK_ONLY_QUEUE: mode.endsWith('queue') ? '1' : '', MK_NO_DAEMONS: '' },
		});
		child.stdout.on('data', data => { output = (output + data).slice(-24000); });
		child.stderr.on('data', data => { output = (output + data).slice(-24000); });
		const exited = once(child, 'exit');
		void exited.catch(() => {});
		let socket;
		try {
			await new Promise((resolve, reject) => {
				const timer = setTimeout(() => reject(new Error(`Readiness timed out: ${output}`)), 60000);
				child.once('error', error => { clearTimeout(timer); reject(error); });
				child.once('exit', code => { clearTimeout(timer); reject(new Error(`Exited before readiness (${code}): ${output}`)); });
				child.on('message', message => { if (message === 'ok') { clearTimeout(timer); resolve(); } });
			});
			if (!mode.endsWith('queue')) {
				const post = (path, body) => fetch(`http://127.0.0.1:${config.port}${path}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
					signal: AbortSignal.timeout(10000),
				});
				const response = await post('/api/ping', {});
				assert.equal(response.status, 200); assert.equal(typeof (await response.json()).pong, 'number');
				const endpointNames = await post('/api/endpoints', { endpoint: 'ping' });
				assert.equal(endpointNames.status, 200);
				assert.ok((await endpointNames.json()).includes('ping'));
				const pingDescriptor = await post('/api/endpoint', { endpoint: 'ping' });
				assert.equal(pingDescriptor.status, 200);
				assert.deepEqual(await pingDescriptor.json(), { params: [] });
				const selfDescriptor = await post('/api/endpoint', { endpoint: 'endpoint' });
				assert.equal(selfDescriptor.status, 200);
				assert.deepEqual(await selfDescriptor.json(), { params: [{ name: 'endpoint', type: 'String' }] });
				const unknownDescriptor = await post('/api/endpoint', { endpoint: 'not-a-real-endpoint' });
				assert.equal(unknownDescriptor.status, 204);
				const stats = await post('/api/stats', {});
				assert.equal(stats.status, 200);
				const totals = await stats.json();
				for (const key of ['notesCount', 'originalNotesCount', 'usersCount', 'originalUsersCount', 'reactionsCount', 'instances']) assert.equal(typeof totals[key], 'number');
				assert.equal(totals.driveUsageLocal, 0); assert.equal(totals.driveUsageRemote, 0);
				const info = await fetch(`http://127.0.0.1:${config.port}/api/server-info`, { signal: AbortSignal.timeout(10000) });
				assert.equal(info.status, 200);
				assert.deepEqual(await info.json(), { machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } });
				const onlineUsersCount = await fetch(`http://127.0.0.1:${config.port}/api/get-online-users-count`, { signal: AbortSignal.timeout(10000) });
				assert.equal(onlineUsersCount.status, 200);
				const onlineUsersCountBody = await onlineUsersCount.json();
				assert.equal(typeof onlineUsersCountBody.count, 'number');
				assert.ok(onlineUsersCountBody.count >= 0);
				socket = new WebSocket(`ws://127.0.0.1:${config.port}/streaming`);
				await once(socket, 'open', { signal: AbortSignal.timeout(10000) });
			}
			const socketClosed = socket ? once(socket, 'close') : undefined;
			child.kill('SIGTERM');
			const [code, signal] = await new Promise((resolve, reject) => {
				const timer = setTimeout(() => reject(new Error(`Process did not exit: ${output}`)), 15000);
				exited.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
			});
			assert.equal(signal, null, output); assert.equal(code, 0, output);
			assert.throws(() => process.kill(-child.pid, 0), { code: 'ESRCH' }, 'No cluster child may outlive the primary');
			assert.doesNotMatch(output, /Shutdown tasks timed out|Shutdown task failed/);
			if (socketClosed) assert.equal((await socketClosed)[0], 1001, output);
			assert.equal((await db.query('SELECT 1 AS ready'))[0].ready, 1);
		} finally {
			socket?.terminate();
			// The detached group belongs only to this test, including its cluster workers.
			if (child.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') console.error('Failed to clean up test group:', error); } }
		}
	});
}
