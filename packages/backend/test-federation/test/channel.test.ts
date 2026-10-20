/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { strictEqual } from 'node:assert';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import type * as Misskey from 'misskey-js';
import { createAccount, isFired, isNoteUpdatedEventFired, FEDERATION_TIMEOUT, WAIT_FOR_FEDERATION } from './utils.js';
import type { LoginUser } from './utils.js';

describe('Channel Group federation pilot', () => {
	let alice: LoginUser;
	let bob: LoginUser;
	let channel: Misskey.entities.Channel;
	let remoteChannel: Misskey.entities.Channel;
	let preSubscription: Misskey.entities.Note;
	beforeAll(async () => {
		alice = await createAccount('a.test');
		bob = await createAccount('b.test');
		channel = await alice.client.request('channels/create', { name: crypto.randomUUID(), isFederated: true, allowRenoteToExternal: false });
		strictEqual(channel.isFederated, true);
		strictEqual(channel.allowRenoteToExternal, true);
		preSubscription = (await alice.client.request('notes/create', { channelId: channel.id, text: 'before subscription' })).createdNote;
		const group = await bob.client.request('ap/show', { uri: `https://a.test/channels/${channel.id}` });
		strictEqual(group.type, 'User');
		if (group.type !== 'User') throw new Error('Group actor did not resolve');
		await bob.client.request('following/create', { userId: group.object.id });
		remoteChannel = await vi.waitFor(async () => {
			const channels = await bob.client.request('channels/followed', { limit: 100 });
			const remote = channels.find(c => c.uri === `https://a.test/channels/${channel.id}`);
			strictEqual(remote != null, true);
			return remote!;
		}, WAIT_FOR_FEDERATION);
	});

	test('first publication reaches HTL stream and DB while staying outside GTL', async () => {
		const text = crypto.randomUUID();
		let created!: Misskey.entities.Note;
		const fired = await isFired('b.test', bob, 'homeTimeline', async () => {
			created = (await alice.client.request('notes/create', { channelId: channel.id, text })).createdNote;
		}, 'note', note => note.text === text, {}, FEDERATION_TIMEOUT);
		strictEqual(fired, true);
		strictEqual(created.localOnly, false);
		const remote = await vi.waitFor(async () => {
			const timeline = await bob.client.request('channels/timeline', { channelId: remoteChannel.id });
			const note = timeline.find(n => n.uri === `https://a.test/notes/${created.id}`);
			strictEqual(note != null, true);
			return note!;
		}, WAIT_FOR_FEDERATION);
		strictEqual(remote.channelId, remoteChannel.id);
		strictEqual(remote.user.username, alice.username);
		const global = await bob.client.request('notes/global-timeline', {});
		strictEqual(global.some(n => n.id === remote.id), false);
		strictEqual(await isNoteUpdatedEventFired('b.test', bob, remote.id, async () => {
			await alice.client.request('notes/delete', { noteId: created.id });
		}, update => update.type === 'deleted' && update.id === remote.id, FEDERATION_TIMEOUT), true);
		await vi.waitFor(async () => {
			const timeline = await bob.client.request('channels/timeline', { channelId: remoteChannel.id });
			strictEqual(timeline.some(n => n.id === remote.id), false);
		}, WAIT_FOR_FEDERATION);
	});

	test('fetches Group approval for a public parent created before subscription', async () => {
		const reply = (await alice.client.request('notes/create', { channelId: channel.id, replyId: preSubscription.id, text: crypto.randomUUID() })).createdNote;
		await vi.waitFor(async () => {
			const timeline = await bob.client.request('channels/timeline', { channelId: remoteChannel.id });
			const remote = timeline.find(n => n.uri === `https://a.test/notes/${reply.id}`);
			strictEqual(remote?.reply?.uri, `https://a.test/notes/${preSubscription.id}`);
		}, WAIT_FOR_FEDERATION);
	});

	test('ordinary author Renote imports an unknown channel without subscribing to its Group', async () => {
		const booster = await createAccount('a.test');
		const remoteBooster = await bob.client.request('ap/show', { uri: `https://a.test/users/${booster.id}` });
		if (remoteBooster.type !== 'User') throw new Error('Renote author did not resolve');
		await bob.client.request('following/create', { userId: remoteBooster.object.id });
		await vi.waitFor(async () => {
			const followers = await booster.client.request('users/followers', { userId: booster.id });
			strictEqual(followers.some(row => row.follower?.username === bob.username), true);
		}, WAIT_FOR_FEDERATION);
		const unknown = await alice.client.request('channels/create', { name: crypto.randomUUID(), isFederated: true });
		const original = (await alice.client.request('notes/create', { channelId: unknown.id, text: crypto.randomUUID() })).createdNote;
		const followersBefore = await fetch(`https://a.test/channels/${unknown.id}/followers`, { headers: { accept: 'application/activity+json' } }).then(r => r.json()) as { totalItems: number };
		strictEqual(followersBefore.totalItems, 0);
		const renote = (await booster.client.request('notes/create', { renoteId: original.id })).createdNote;
		const received = await vi.waitFor(async () => {
			const timeline = await bob.client.request('notes/hybrid-timeline', {});
			const result = timeline.find(note => note.uri === `https://a.test/notes/${renote.id}`);
			strictEqual(result?.renote?.uri, `https://a.test/notes/${original.id}`);
			return result!;
		}, WAIT_FOR_FEDERATION);
		strictEqual(received.channelId == null, true);
		strictEqual(received.user.username, booster.username);
		strictEqual(received.renote!.user.username, alice.username);
		const imported = await bob.client.request('channels/show', { channelId: received.renote!.channelId! });
		strictEqual(imported.uri, `https://a.test/channels/${unknown.id}`);
		strictEqual(imported.isFollowing, false);
		const followersAfter = await fetch(`https://a.test/channels/${unknown.id}/followers`, { headers: { accept: 'application/activity+json' } }).then(r => r.json()) as { totalItems: number };
		strictEqual(followersAfter.totalItems, 0);
	});

	test('direct ap/show acquires an unknown public channel Note and concurrent replay stays unique', async () => {
		const unknown = await alice.client.request('channels/create', { name: crypto.randomUUID(), isFederated: true });
		const original = (await alice.client.request('notes/create', { channelId: unknown.id, text: crypto.randomUUID() })).createdNote;
		const uri = `https://a.test/notes/${original.id}`;
		const results = await Promise.all([bob.client.request('ap/show', { uri }), bob.client.request('ap/show', { uri })]);
		if (results[0].type !== 'Note' || results[1].type !== 'Note') throw new Error('Channel Note did not resolve');
		strictEqual(results[0].object.id, results[1].object.id);
		const imported = await bob.client.request('channels/show', { channelId: results[0].object.channelId! });
		strictEqual(imported.uri, `https://a.test/channels/${unknown.id}`);
		strictEqual(imported.isFollowing, false);
		const timeline = await bob.client.request('channels/timeline', { channelId: imported.id });
		strictEqual(timeline.filter(note => note.uri === uri).length, 1);
	});

	test('refuses localOnly and local-only quotes without rewriting the target', async () => {
		await expect(alice.client.request('notes/create', { channelId: channel.id, localOnly: true, text: 'rejected' })).rejects.toMatchObject({ code: 'CHANNEL_FEDERATION_REQUIRES_PUBLIC' });
		const local = (await alice.client.request('notes/create', { localOnly: true, text: 'local target' })).createdNote;
		await expect(alice.client.request('notes/create', { channelId: channel.id, renoteId: local.id, text: 'quote' })).rejects.toMatchObject({ code: 'CHANNEL_FEDERATION_REQUIRES_PUBLIC' });
		strictEqual((await alice.client.request('notes/show', { noteId: local.id })).localOnly, true);
	});

	test('remote channel API Undo stops and Follow resumes publications', async () => {
		await bob.client.request('channels/unfollow', { channelId: remoteChannel.id });
		await vi.waitFor(async () => {
			const followers = await fetch(`https://a.test/channels/${channel.id}/followers`, { headers: { accept: 'application/activity+json' } }).then(r => r.json()) as { totalItems: number };
			strictEqual(followers.totalItems, 0);
		}, WAIT_FOR_FEDERATION);
		await bob.client.request('channels/follow', { channelId: remoteChannel.id });
		await vi.waitFor(async () => {
			strictEqual((await bob.client.request('channels/show', { channelId: remoteChannel.id })).isFollowing, true);
		}, WAIT_FOR_FEDERATION);
		const text = crypto.randomUUID();
		strictEqual(await isFired('b.test', bob, 'homeTimeline', async () => {
			await alice.client.request('notes/create', { channelId: channel.id, text });
		}, 'note', note => note.text === text, {}, FEDERATION_TIMEOUT), true);
	});
});
