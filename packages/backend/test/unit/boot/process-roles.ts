/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { WebSocket } from 'ws';
import type { DataSource } from 'typeorm';
import { loadConfig } from '@/config.js';
import { createPostgresDataSource } from '@features/persistence/backend/postgres.js';
import { MiMeta } from '@features/instance/backend/models/Meta.js';
import { MiEmoji } from '@features/emojis/backend/models/Emoji.js';

// Spawns the built backend (`built/entry.js`); CI runs `pnpm build` before the unit job.
const backendDir = fileURLToPath(new URL('../../../', import.meta.url));

const emojiFixtures = [
	{ id: 'featureemoji000000000001', name: 'feature_b', host: null, category: 'a', originalUrl: 'https://example.invalid/b.png', publicUrl: '' },
	{ id: 'featureemoji000000000002', name: 'feature_a', host: null, category: 'a', originalUrl: 'https://example.invalid/a.png', publicUrl: '' },
	{ id: 'featureemoji000000000003', name: 'feature_c', host: null, category: 'b', originalUrl: 'https://example.invalid/c.png', publicUrl: '' },
	{ id: 'featureemoji000000000004', name: 'feature_a', host: 'remote.invalid', category: 'a', originalUrl: 'https://remote.invalid/a.png', publicUrl: '' },
	{ id: 'featureemoji000000000005', name: 'feature_remote_only', host: 'remote.invalid', category: 'a', originalUrl: 'https://remote.invalid/only.png', publicUrl: '' },
];

const modes = ['server', 'queue', 'combined', 'cluster', 'cluster-server', 'cluster-queue'] as const;

describe('process roles', () => {
	const config = loadConfig();
	let db: DataSource;
	const url = (path: string) => `http://127.0.0.1:${config.port}${path}`;
	const get = (path: string) => fetch(url(path), { signal: AbortSignal.timeout(10000) });
	const post = (path: string, body: unknown) => fetch(url(path), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(10000),
	});

	beforeAll(async () => {
		// The test DataSource drops the schema. Never run against anything but the disposable test services.
		expect(config.db.host).toBe('127.0.0.1');
		expect(config.db.port).toBe(54312);
		expect(config.db.db).toBe('test-misskey');
		expect(config.redis.host).toBe('127.0.0.1');
		expect(config.redis.port).toBe(56312);
		expect(config.clusterLimit).toBe(1);

		db = createPostgresDataSource(config);
		await db.initialize();
		await db.getRepository(MiMeta).save({ id: 'x', enableServerMachineStats: false });
		await db.getRepository(MiEmoji).save(emojiFixtures);
	});

	afterAll(async () => {
		if (db?.isInitialized) {
			try {
				await db.getRepository(MiEmoji).delete(emojiFixtures.map(emoji => emoji.id));
			} finally {
				await db.destroy();
			}
		}
	});

	async function checkWebRole() {
		// Relocating web services must preserve the public manifest and actual static bytes.
		const manifest = await get('/manifest.json');
		expect(manifest.status).toBe(200);
		expect(manifest.headers.get('content-type')).toMatch(/application\/json/);
		expect((await manifest.json()).start_url).toBe('/');
		for (const asset of ['icons/192.png', 'icons/512.png', 'splash.png']) {
			const response = await get(`/static-assets/${asset}`);
			expect(response.status, asset).toBe(200);
			expect(response.headers.get('content-type')).toMatch(/image\/png/);
			expect(Buffer.from(await response.arrayBuffer())).toEqual(await readFile(join(config.rootDir, 'packages/backend/assets', asset)));
		}

		// Feature-owned SSR templates still render through the existing web routes.
		for (const path of ['/bios', '/cli', '/_info_card_']) {
			const page = await get(path);
			expect(page.status, path).toBe(200);
			expect(page.headers.get('content-type')).toMatch(/text\/html/);
			expect(await page.text()).toMatch(/<!DOCTYPE html>/i);
		}

		const ping = await post('/api/ping', {});
		expect(ping.status).toBe(200);
		expect(typeof (await ping.json()).pong).toBe('number');

		const endpointNames = await post('/api/endpoints', { endpoint: 'ping' });
		expect(endpointNames.status).toBe(200);
		expect(await endpointNames.json()).toContain('ping');
		const pingDescriptor = await post('/api/endpoint', { endpoint: 'ping' });
		expect(pingDescriptor.status).toBe(200);
		expect(await pingDescriptor.json()).toEqual({ params: [] });
		const selfDescriptor = await post('/api/endpoint', { endpoint: 'endpoint' });
		expect(selfDescriptor.status).toBe(200);
		expect(await selfDescriptor.json()).toEqual({ params: [{ name: 'endpoint', type: 'String' }] });
		expect((await post('/api/endpoint', { endpoint: 'not-a-real-endpoint' })).status).toBe(204);

		const emojis = await get('/api/emojis');
		expect(emojis.status).toBe(200);
		const listed = ((await emojis.json()).emojis as { name: string; url: string }[])
			.filter(emoji => emojiFixtures.some(fixture => fixture.name === emoji.name));
		expect(listed.map(emoji => emoji.name)).toEqual(['feature_a', 'feature_b', 'feature_c']);
		expect(listed[0].url).toBe('https://example.invalid/a.png');
		expect(listed[0]).not.toHaveProperty('localOnly');
		const emoji = await post('/api/emoji', { name: 'feature_a' });
		expect(emoji.status).toBe(200);
		const detail = await emoji.json();
		expect(detail.id).toBe('featureemoji000000000002');
		expect(detail.host).toBeNull();
		expect(detail.localOnly).toBe(false);
		expect(detail).not.toHaveProperty('originalUrl');
		expect((await post('/api/emoji', { name: 'feature_remote_only' })).status).not.toBe(200);

		const decorations = await post('/api/get-avatar-decorations', { authenticated: true });
		expect(decorations.status).toBe(200);
		expect(Array.isArray(await decorations.json())).toBe(true);

		const stats = await post('/api/stats', {});
		expect(stats.status).toBe(200);
		const totals = await stats.json();
		for (const key of ['notesCount', 'originalNotesCount', 'usersCount', 'originalUsersCount', 'reactionsCount', 'instances']) {
			expect(typeof totals[key], key).toBe('number');
		}
		expect(totals.driveUsageLocal).toBe(0);
		expect(totals.driveUsageRemote).toBe(0);

		const info = await get('/api/server-info');
		expect(info.status).toBe(200);
		expect(await info.json()).toEqual({ machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } });

		const onlineUsersCount = await get('/api/get-online-users-count');
		expect(onlineUsersCount.status).toBe(200);
		const { count } = await onlineUsersCount.json();
		expect(typeof count).toBe('number');
		expect(count).toBeGreaterThanOrEqual(0);

		const socket = new WebSocket(`ws://127.0.0.1:${config.port}/streaming`);
		await once(socket, 'open', { signal: AbortSignal.timeout(10000) });
		return socket;
	}

	test.each(modes)('%s reaches readiness and drains on SIGTERM without the process deadline', async mode => {
		let output = '';
		const child = spawn(process.execPath, ['built/entry.js'], {
			cwd: backendDir,
			detached: true,
			stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
			env: {
				...process.env,
				NODE_ENV: 'development',
				MK_DISABLE_CLUSTERING: mode.startsWith('cluster') ? '' : '1',
				MK_ONLY_SERVER: mode.endsWith('server') ? '1' : '',
				MK_ONLY_QUEUE: mode.endsWith('queue') ? '1' : '',
				MK_NO_DAEMONS: '',
			},
		});
		child.stdout!.on('data', data => { output = (output + data).slice(-24000); });
		child.stderr!.on('data', data => { output = (output + data).slice(-24000); });
		const exited = once(child, 'exit') as Promise<[number | null, NodeJS.Signals | null]>;
		void exited.catch(() => {});
		let socket: WebSocket | undefined;
		try {
			await new Promise<void>((resolve, reject) => {
				const timer = setTimeout(() => reject(new Error(`Readiness timed out: ${output}`)), 60000);
				child.once('error', error => { clearTimeout(timer); reject(error); });
				child.once('exit', code => { clearTimeout(timer); reject(new Error(`Exited before readiness (${code}): ${output}`)); });
				child.on('message', message => { if (message === 'ok') { clearTimeout(timer); resolve(); } });
			});

			if (!mode.endsWith('queue')) socket = await checkWebRole();

			const socketClosed = socket ? once(socket, 'close') : undefined;
			child.kill('SIGTERM');
			const [code, signal] = await new Promise<[number | null, NodeJS.Signals | null]>((resolve, reject) => {
				const timer = setTimeout(() => reject(new Error(`Process did not exit: ${output}`)), 15000);
				exited.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
			});
			expect(signal, output).toBeNull();
			expect(code, output).toBe(0);
			let groupProbe: unknown;
			try { process.kill(-child.pid!, 0); } catch (error) { groupProbe = error; }
			expect((groupProbe as NodeJS.ErrnoException | undefined)?.code, 'No cluster child may outlive the primary').toBe('ESRCH');
			expect(output).not.toMatch(/Shutdown tasks timed out|Shutdown task failed/);
			if (socketClosed) expect((await socketClosed)[0], output).toBe(1001);
			expect((await db.query('SELECT 1 AS ready'))[0].ready).toBe(1);
		} finally {
			socket?.terminate();
			// The detached group belongs only to this test, including its cluster workers.
			if (child.pid) {
				try {
					process.kill(-child.pid, 'SIGKILL');
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code !== 'ESRCH') console.error('Failed to clean up test group:', error);
				}
			}
		}
	}, 90000);
});
