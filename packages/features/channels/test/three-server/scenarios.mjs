/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { userInfo } from 'node:os';

const require = createRequire(join(process.env.CHANNEL_FIXTURE_ROOT, 'packages/backend/package.json'));
const { Client } = require('pg');
const WebSocket = require('ws');
const directory = process.env.CHANNEL_FIXTURE_DIRECTORY;
const origin = host => `https://${host}.test`;
const clients = {};
let stream;
const passed = [];

async function api(host, endpoint, params = {}, token) {
	const response = await fetch(`${origin(host)}/api/${endpoint}`, {
		method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...params, ...(token ? { i: token } : {}) }), signal: AbortSignal.timeout(15_000),
	});
	const text = await response.text();
	const result = text ? JSON.parse(text) : null;
	if (!response.ok) throw Object.assign(new Error(`${host} ${endpoint}: ${response.status} ${result?.error?.code ?? ''} ${result?.message ?? result?.error?.message ?? ''}`), { code: result?.error?.code });
	return result;
}

async function wait(check, label, timeout = 30_000) {
	const deadline = Date.now() + timeout;
	let last;
	while (Date.now() < deadline) {
		try { const result = await check(); if (result) return result; } catch (error) { last = error; }
		await new Promise(done => setTimeout(done, 200));
	}
	throw new Error(`Timed out: ${label}`, { cause: last });
}

function success(name) { passed.push(name); console.log(`PASS ${passed.length}: ${name}`); }

async function account(host, username, admin) {
	const password = crypto.randomUUID();
	await api(host, 'admin/accounts/create', { username, password }, admin?.i);
	// Preserve the production authentication limiter; space synthetic logins like test-federation/utils.ts.
	await new Promise(done => setTimeout(done, 1100));
	const result = await api(host, 'signin-flow', { username, password });
	assert.equal(result.finished, true);
	return { ...result, username, request: (endpoint, params) => api(host, endpoint, params, result.i) };
}

async function followers(uri) {
	const response = await fetch(`${uri}/followers`, { headers: { accept: 'application/activity+json' }, signal: AbortSignal.timeout(10_000) });
	assert.equal(response.status, 200);
	return (await response.json()).totalItems;
}

async function stored(host, uri) {
	return (await clients[host].query('SELECT id, "channelId", uri FROM note WHERE uri = $1', [uri])).rows;
}

try {
	const admins = {};
	for (const host of ['a', 'b', 'c']) {
		clients[host] = new Client({ host: join(directory, 'pg'), port: 55439, database: `channel_${host}`, user: userInfo().username });
		await clients[host].connect();
		admins[host] = await account(host, 'admin');
		await admins[host].request('admin/roles/update-default-policies', { policies: { rateLimitFactor: 0, canFederateChannel: true } });
		await admins[host].request('admin/update-meta', { federation: 'all' });
	}
	const alice = await account('a', 'alice', admins.a);
	const bob = await account('b', 'bob', admins.b);
	const carol = await account('c', 'carol', admins.c);
	const channel = await alice.request('channels/create', { name: 'Three-server public channel', isFederated: true });
	const groupUri = `${origin('a')}/channels/${channel.id}`;
	const group = await bob.request('ap/show', { uri: groupUri });
	assert.equal(group.type, 'User');
	await bob.request('following/create', { userId: group.object.id });
	const remoteB = await wait(async () => (await bob.request('channels/followed', { limit: 100 })).find(item => item.uri === groupUri), 'B accepts A Group');
	await wait(async () => await followers(groupUri) === 1, 'A records B Group subscription');
	const remoteBob = await carol.request('ap/show', { uri: `${origin('b')}/users/${bob.id}` });
	assert.equal(remoteBob.type, 'User');
	await carol.request('following/create', { userId: remoteBob.object.id });
	await wait(async () => (await bob.request('users/followers', { userId: bob.id })).some(row => row.follower?.username === carol.username), 'B accepts C author follow');
	assert.equal((await clients.c.query('SELECT count(*)::int AS count FROM channel')).rows[0].count, 0);
	success('A Group Follow/Accept on B and B author Follow/Accept on C use three distinct HTTPS origins');

	const streamMessages = [];
	stream = new WebSocket(`${origin('c').replace('https:', 'wss:')}/streaming?i=${encodeURIComponent(carol.i)}`);
	stream.on('message', data => { streamMessages.push(JSON.parse(data.toString())); });
	await once(stream, 'open');
	stream.send(JSON.stringify({ type: 'connect', body: { channel: 'homeTimeline', id: 'fixture-home', pong: true } }));
	await wait(() => streamMessages.some(message => message.type === 'connected' && message.body.id === 'fixture-home'), 'C home stream acknowledgement');
	const original = (await alice.request('notes/create', { channelId: channel.id, text: 'A to B to C canonical public note' })).createdNote;
	const noteUri = `${origin('a')}/notes/${original.id}`;
	const noteB = await wait(async () => (await bob.request('channels/timeline', { channelId: remoteB.id })).find(note => note.uri === noteUri), 'A Group publication reaches B');
	assert.equal((await stored('c', noteUri)).length, 0);
	const renote = (await bob.request('notes/create', { renoteId: noteB.id })).createdNote;
	const renoteUri = `${origin('b')}/notes/${renote.id}/activity`;
	const delivered = await wait(() => streamMessages.find(message => message.type === 'channel' && message.body.type === 'note' && message.body.body.uri === renoteUri)?.body.body, 'B ordinary Renote reaches C home stream');
	assert.equal(delivered.channelId == null, true);
	assert.equal(delivered.user.host, new URL(origin('b')).host);
	assert.equal(delivered.renote.uri, noteUri);
	assert.equal(delivered.renote.user.host, new URL(origin('a')).host);
	const importedC = await carol.request('channels/show', { channelId: delivered.renote.channelId });
	assert.equal(importedC.uri, groupUri);
	assert.equal(importedC.isFollowing, false);
	assert.equal(await followers(groupUri), 1, 'Reference acquisition must not subscribe C to the Group');
	assert.equal((await stored('c', noteUri)).length, 1);
	assert.equal((await stored('c', noteUri))[0].channelId, importedC.id);
	assert.equal((await carol.request('notes/global-timeline', {})).some(note => note.uri === noteUri), false);
	success('A → B Group delivery → C ordinary Renote retains canonical A author/channel in DB and C stream without a Group follow or GTL leak');

	const isolated = await alice.request('channels/create', { name: 'Unknown reference channel', isFederated: true });
	const fresh = (await alice.request('notes/create', { channelId: isolated.id, text: 'Concurrent URL acquisition' })).createdNote;
	const freshUri = `${origin('a')}/notes/${fresh.id}`;
	const acquired = await Promise.all([carol.request('ap/show', { uri: freshUri }), carol.request('ap/show', { uri: freshUri })]);
	assert.equal(acquired[0].type, 'Note'); assert.equal(acquired[1].type, 'Note');
	assert.equal(acquired[0].object.id, acquired[1].object.id);
	assert.equal((await stored('c', freshUri)).length, 1);
	const freshChannel = await carol.request('channels/show', { channelId: acquired[0].object.channelId });
	assert.equal(freshChannel.uri, `${origin('a')}/channels/${isolated.id}`);
	assert.equal(freshChannel.isFollowing, false);
	assert.equal(await followers(freshChannel.uri), 0);
	success('Concurrent C URL acquisition of an unknown A channel stays unique and never subscribes');

	const fetchedB = await bob.request('ap/show', { uri: freshUri });
	assert.equal(fetchedB.type, 'Note');
	const outsider = await account('b', 'outsider', admins.b);
	const otherRenote = (await outsider.request('notes/create', { renoteId: fetchedB.object.id })).createdNote;
	// ap/show resolves Actor/Note resources, not an arbitrary Activity URL. The
	// ordinary signed Announce inbox path above is the supported Renote path.
	await assert.rejects(carol.request('ap/show', { uri: `${origin('b')}/notes/${otherRenote.id}/activity` }), { code: 'NO_SUCH_OBJECT' });
	assert.equal((await stored('c', freshUri)).length, 1);
	assert.equal((await stored('c', `${origin('b')}/notes/${otherRenote.id}/activity`)).length, 0);
	success('Direct ap/show preserves its Actor/Note boundary instead of importing an unsupported Announce activity URL');

	await carol.request('channels/follow', { channelId: importedC.id });
	await wait(async () => await followers(groupUri) === 2, 'C explicit Group Follow accepted');
	const shared = (await alice.request('notes/create', { channelId: channel.id, text: 'Both Group subscribers' })).createdNote;
	const sharedUri = `${origin('a')}/notes/${shared.id}`;
	await wait(async () => (await stored('b', sharedUri)).length === 1 && (await stored('c', sharedUri)).length === 1, 'A Group publication reaches B and C');
	await alice.request('notes/delete', { noteId: shared.id });
	await wait(async () => (await stored('b', sharedUri)).length === 0 && (await stored('c', sharedUri)).length === 0, 'A author Delete reaches both Group subscribers');
	success('Explicit C Group Follow receives later publications and signed author deletion on both B and C');

	await carol.request('channels/unfollow', { channelId: importedC.id });
	await wait(async () => await followers(groupUri) === 1, 'C Group Undo');
	assert.equal((await carol.request('channels/show', { channelId: importedC.id })).isFollowing, false);
	assert.equal((await bob.request('channels/show', { channelId: remoteB.id })).isFollowing, true);
	success('C Group Undo removes only its own subscription and retains B');

	await assert.rejects(alice.request('notes/create', { channelId: channel.id, localOnly: true, text: 'must not publish' }), { code: 'CHANNEL_FEDERATION_REQUIRES_PUBLIC' });
	const local = (await alice.request('notes/create', { localOnly: true, text: 'local-only target' })).createdNote;
	await assert.rejects(alice.request('notes/create', { channelId: channel.id, renoteId: local.id, text: 'must not quote' }), { code: 'CHANNEL_FEDERATION_REQUIRES_PUBLIC' });
	await assert.rejects(carol.request('ap/show', { uri: `${origin('a')}/notes/${local.id}` }));
	assert.equal((await stored('c', `${origin('a')}/notes/${local.id}`)).length, 0);
	success('Local-only publication/quote restrictions and remote retrieval refusal are preserved');
	writeFileSync(join(directory, 'results.json'), JSON.stringify({ passed, origins: ['a', 'b', 'c'].map(origin), groupUri, noteUri, renoteUri, automaticGroupFollow: false, limitations: ['Reference-only non-subscribers are not promised later push delivery/deletion; deletion tested after explicit Group subscription'] }, null, 2));
} finally {
	if (stream) { stream.close(); stream.terminate(); }
	await Promise.all(Object.values(clients).map(client => client.end()));
}
