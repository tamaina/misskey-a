/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../../../backend/built/features/boot/backend.js';

function harness() {
	const messages = [];
	const calls = [];
	return {
		messages, calls,
		output: { log: text => messages.push(text), error: text => messages.push(text) },
		commands: {
			ping: { description: 'Prints pong', run: () => { calls.push('ping'); } },
			'reset-captcha': { description: 'Resets the captcha', run: () => { calls.push('reset'); } },
		},
	};
}

test('help has no resource or command side effects', async () => {
	const h = harness();
	assert.equal(await runCli('help', h.commands, h.output), 0);
	assert.deepEqual(h.calls, []);
	assert.ok(h.messages.includes('  reset-captcha - Resets the captcha'));
});

test('ping does not acquire maintenance resources', async () => {
	const h = harness();
	assert.equal(await runCli('ping', h.commands, h.output), 0);
	assert.deepEqual(h.calls, ['ping']);
});

test('unknown and inherited names do not invoke a command', async () => {
	for (const name of ['missing', 'toString', '__proto__', 'constructor']) {
		const h = harness();
		assert.equal(await runCli(name, h.commands, h.output), 1);
		assert.deepEqual(h.calls, []);
	}
});

test('command errors remain visible to the process owner', async () => {
	const failure = new Error('maintenance failed');
	const h = harness();
	h.commands.ping.run = () => { throw failure; };
	await assert.rejects(runCli('ping', h.commands, h.output), error => error === failure);
});
