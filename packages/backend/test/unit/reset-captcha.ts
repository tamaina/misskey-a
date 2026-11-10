/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import { loadConfig } from '@/config.js';
import { createPostgresDataSource } from '@features/persistence/backend/postgres.js';
import { MiMeta } from '@features/instance/backend/models/Meta.js';
import { resetCaptcha } from '@features/boot/backend/node/reset-captcha.js';

type MetaUpdatedEvent = {
	channel: string;
	message: { type: string; body: { before?: Partial<MiMeta>; after: Partial<MiMeta> } };
};

describe('reset-captcha maintenance command', () => {
	const config = loadConfig();
	let db: DataSource;
	let subscriber: Redis;
	let admin: Redis;
	const events: MetaUpdatedEvent[] = [];

	// The command publishes through its own Redis connection; count only normal (non-pubsub) clients.
	const normalClients = async () => (await admin.call('CLIENT', 'LIST', 'TYPE', 'normal') as string).trim().split('\n').length;

	beforeAll(async () => {
		// The test DataSource drops the schema. Never run against anything but the disposable test services.
		expect(config.db.host).toBe('127.0.0.1');
		expect(config.db.port).toBe(54312);
		expect(config.db.db).toBe('test-misskey');
		expect(config.redisForPubsub.host).toBe('127.0.0.1');
		expect(config.redisForPubsub.port).toBe(56312);

		db = createPostgresDataSource(config);
		await db.initialize();
		subscriber = new Redis({ ...config.redisForPubsub, lazyConnect: true });
		admin = new Redis({ ...config.redisForPubsub, lazyConnect: true });
		await subscriber.connect();
		await admin.connect();
		subscriber.on('message', (_, value: string) => { events.push(JSON.parse(value)); });
		await subscriber.subscribe(config.host);
	});

	afterAll(async () => {
		subscriber?.disconnect();
		admin?.disconnect();
		if (db?.isInitialized) await db.destroy();
	});

	test('updates the selected row, publishes the committed snapshot, and releases its resources', async () => {
		const destroy = vi.spyOn(DataSource.prototype, 'destroy');
		const repository = db.getRepository(MiMeta);
		await repository.save([
			{ id: 'a', enableHcaptcha: true, name: 'older row' },
			{ id: 'z', enableHcaptcha: true, hcaptchaSiteKey: 'synthetic-site', hcaptchaSecretKey: 'synthetic-secret', enableTurnstile: true, name: 'preserve this name' },
		]);
		const clientsBefore = await normalClients();

		await resetCaptcha();

		// The legacy choice for duplicate rows is the highest id; other columns and rows stay untouched.
		const after = await repository.findOneByOrFail({ id: 'z' });
		expect(after.enableHcaptcha).toBe(false);
		expect(after.hcaptchaSiteKey).toBeNull();
		expect(after.hcaptchaSecretKey).toBeNull();
		expect(after.enableTurnstile).toBe(false);
		expect(after.name).toBe('preserve this name');
		expect((await repository.findOneByOrFail({ id: 'a' })).enableHcaptcha).toBe(true);

		await vi.waitFor(() => expect(events).toHaveLength(1));
		expect(events[0].channel).toBe('internal');
		expect(events[0].message.type).toBe('metaUpdated');
		expect(events[0].message.body.before?.enableHcaptcha).toBe(true);
		expect(events[0].message.body.after.enableHcaptcha).toBe(false);
		expect(events[0].message.body.after.id).toBe('z');

		// The command closes its own database and Redis connections so the CLI process can exit.
		expect(destroy).toHaveBeenCalledTimes(1);
		await vi.waitFor(async () => expect(await normalClients()).toBe(clientsBefore));

		// Without any row, the command creates the default row and publishes no previous snapshot.
		await repository.delete(['a', 'z']);
		await resetCaptcha();
		expect((await repository.findOneByOrFail({ id: 'x' })).enableHcaptcha).toBe(false);
		await vi.waitFor(() => expect(events).toHaveLength(2));
		expect(events[1].message.body.before).toBeUndefined();
		expect(destroy).toHaveBeenCalledTimes(2);
		await vi.waitFor(async () => expect(await normalClients()).toBe(clientsBefore));
	});
});
