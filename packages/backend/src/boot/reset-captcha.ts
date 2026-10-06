/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { Redis } from 'ioredis';
import { runTask } from '@features/boot/backend';
import { createResetCaptcha } from '@features/instance/backend';
import { loadConfig } from '@/config.js';
import { createPostgresDataSource } from '@/postgres.js';
import { updateInstanceMeta } from '../../../features/instance/backend/models/update-instance-meta.js';

/** Composition root: this command needs only persistence and event publication. */
export async function resetCaptcha() {
	const config = loadConfig();
	const db = createPostgresDataSource(config);
	// A maintenance command must neither synchronize schema nor start a query cache.
	db.setOptions({ synchronize: false, dropSchema: false, cache: false });
	const publisher = new Redis({ ...config.redisForPubsub, lazyConnect: true });
	const reset = createResetCaptcha(async patch => {
		const change = await updateInstanceMeta(db, patch);
		// Keep the existing internal event envelope; finish publication before closing Redis.
		await publisher.publish(config.host, JSON.stringify({
			channel: 'internal', message: { type: 'metaUpdated', body: change },
		}));
	});
	await runTask([
		{ name: 'database', async start() {
			await db.initialize();
			return () => db.destroy();
		} },
		{ name: 'publisher', async start() {
			try { await publisher.connect(); } catch (error) { publisher.disconnect(); throw error; }
			return async () => {
				try { await publisher.quit(); } finally { publisher.disconnect(); }
			};
		} },
	], reset);
}
