/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { Redis } from 'ioredis';
import { loadConfig } from '../../built/config.js';
import { createPostgresDataSource } from '../../built/postgres.js';

// This suite rebuilds only the dedicated local test database. Never accept a
// production configuration simply because NODE_ENV was accidentally set to test.
const config = loadConfig();
assert.equal(process.env.NODE_ENV, 'test');
assert.equal(config.db.host, '127.0.0.1');
assert.equal(config.db.port, 54312);
assert.equal(config.db.db, 'test-misskey');
assert.equal(config.redisForPubsub.host, '127.0.0.1');
assert.equal(config.redisForPubsub.port, 56312);

function executeCommand() {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, ['built/cli.js', 'reset-captcha'], { cwd: new URL('../../', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'] });
		let output = '';
		child.stdout.on('data', data => { output += data; });
		child.stderr.on('data', data => { output += data; });
		const timer = setTimeout(() => { child.kill(); reject(new Error('CLI did not close its resources')); }, 15000);
		child.once('error', error => { clearTimeout(timer); reject(error); });
		child.once('exit', code => { clearTimeout(timer); if (code === 0) resolve(output); else reject(new Error(`CLI exited ${code}: ${output}`)); });
	});
}

test('maintenance CLI updates the selected row and publishes the committed snapshot without Nest startup', { timeout: 60000 }, async () => {
	const db = createPostgresDataSource(config);
	const subscriber = new Redis({ ...config.redisForPubsub, lazyConnect: true });
	try {
		await db.initialize();
		await subscriber.connect();
		const events = [];
		subscriber.on('message', (_, value) => { events.push(JSON.parse(value)); });
		await subscriber.subscribe(config.host);
		const repository = db.getRepository('MiMeta');
		await repository.save([
			{ id: 'a', enableHcaptcha: true, name: 'older row' },
			{ id: 'z', enableHcaptcha: true, hcaptchaSiteKey: 'synthetic-site', hcaptchaSecretKey: 'synthetic-secret', enableTurnstile: true, name: 'preserve this name' },
		]);
		assert.match(await executeCommand(), /Captcha has been reset/);
		const after = await repository.findOneByOrFail({ id: 'z' });
		assert.equal(after.enableHcaptcha, false);
		assert.equal(after.hcaptchaSecretKey, null);
		assert.equal(after.enableTurnstile, false);
		assert.equal(after.name, 'preserve this name');
		assert.equal((await repository.findOneByOrFail({ id: 'a' })).enableHcaptcha, true);
		assert.equal(events.length, 1);
		assert.equal(events[0].channel, 'internal');
		assert.equal(events[0].message.type, 'metaUpdated');
		assert.equal(events[0].message.body.before.enableHcaptcha, true);
		assert.equal(events[0].message.body.after.enableHcaptcha, false);
		assert.equal(events[0].message.body.after.id, 'z');
		// Only synthetic rows created by this test are removed.
		await repository.delete(['a', 'z']);
		assert.match(await executeCommand(), /Captcha has been reset/);
		assert.equal((await repository.findOneByOrFail({ id: 'x' })).enableHcaptcha, false);
		assert.equal(events.length, 2);
		assert.equal(events[1].message.body.before, undefined);
	} finally {
		subscriber.disconnect();
		if (db.isInitialized) await db.destroy();
	}
});
