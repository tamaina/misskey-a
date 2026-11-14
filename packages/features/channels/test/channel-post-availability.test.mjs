/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../frontend/pages/channel.vue', import.meta.url), 'utf8');

test('the channel footer uses the same signed-in/local boundary as the fixed composer', () => {
	assert.match(source, /<template v-if="\$i && channel && !channel\.host" #footer>/);
	assert.match(source, /<MkPostForm v-if="\$i && !channel\.host && prefer\.r\.showFixedPostFormInChannel\.value"/);
});

test('opening the composer discards remote, loading and signed-out requests', () => {
	const body = source.match(/function openPostForm\(\) \{([\s\S]*?)\n\}/)?.[1];
	assert.ok(body, 'composer action exists');
	const open = new Function('$i', 'channel', 'os', body);
	const calls = [];
	const os = { post: options => calls.push(options) };
	const local = { id: 'local', host: null };
	const remote = { id: 'remote', host: 'remote.test' };
	open(null, { value: local }, os);
	open({ id: 'viewer' }, { value: null }, os);
	open({ id: 'viewer' }, { value: remote }, os);
	assert.equal(calls.length, 0);
	open({ id: 'viewer' }, { value: local }, os);
	assert.deepEqual(calls, [{ channel: local }]);
});
