import type { Endpoints as LegacyEndpoints } from '../src/autogen/endpoint.js';
import { describe, test } from 'vitest';
import { expectType, expectNotAssignable } from 'tsd';
import * as Misskey from '../src/index.js';

describe('API', () => {
	test('success', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});
		const res = await cli.request('meta', { detail: true });
		expectType<Misskey.entities.MetaResponse>(res);
	});

	test('conditional response type (meta)', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('meta', { detail: true });
		expectType<Misskey.entities.MetaResponse>(res);

		const res2 = await cli.request('meta', { detail: false });
		expectType<Misskey.entities.MetaResponse>(res2);

		const res3 = await cli.request('meta', { });
		expectType<Misskey.entities.MetaResponse>(res3);

		const res4 = await cli.request('meta', { detail: true as boolean });
		expectType<Misskey.entities.MetaResponse>(res4);
	});

	test('conditional response type (users/show)', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('users/show', { userId: 'xxxxxxxx' });
		expectType<Misskey.entities.UserDetailed>(res);

		const res2 = await cli.request('users/show', { userIds: ['xxxxxxxx'] });
		expectType<Misskey.entities.UserDetailed[]>(res2);
	});
});

describe('feature contracts', () => {
	test('statistics types come from their feature contract', async () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		const stats = await cli.request('stats');
		expectType<number>(stats.notesCount);
		expectType<number>(stats.originalNotesCount);
		expectType<number>(stats.usersCount);
		expectType<number>(stats.originalUsersCount);
		expectType<number>(stats.reactionsCount);
		expectType<number>(stats.instances);
		expectType<number>(stats.driveUsageLocal);
		expectType<number>(stats.driveUsageRemote);
	});

	test('ping is inferred from its oRPC contract', async () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		expectType<{ pong: number }>(await cli.request('ping'));
		expectType<{ pong: number }>(await cli.request('ping', {}));
	});
	test('server-info is inferred from its oRPC contract', async () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		const result = await cli.request('server-info');
		expectType<string>(result.machine);
		expectType<number>(result.cpu.cores);
		expectType<number>(result.mem.total);
		expectType<number>(result.fs.used);
	});
	test('online user count is inferred from its oRPC contract', async () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		expectType<{ count: number }>(await cli.request('get-online-users-count'));
		expectType<{ count: number }>(await cli.request('get-online-users-count', {}));
	});
	test('endpoint introspection is inferred from its oRPC contract', async () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		expectType<string[]>(await cli.request('endpoints'));
		expectType<string[]>(await cli.request('endpoints', {}));

		const result = await cli.request('endpoint', { endpoint: 'ping' });
		expectType<{ params: { name: string; type: string }[] } | null>(result);

		// @ts-expect-error endpoint is required
		cli.request('endpoint', {});
		// @ts-expect-error endpoint must be a string
		cli.request('endpoint', { endpoint: 1 });
	});
});

test('avatar decoration responses derive from the feature contract', async () => {
	const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
	const result = await cli.request('get-avatar-decorations', {});
	expectType<LegacyEndpoints['get-avatar-decorations']['res']>(result);
	expectType<string>(result[0].id);
	expectType<string[]>(result[0].roleIdsThatCanBeUsedThisDecoration);
	expectType<string | null | undefined>(result[0].category);
});

test('public emoji response types remain compatible with generated entities', async () => {
	const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
	const detailed = await cli.request('emoji', { name: 'sample' });
	const list = await cli.request('emojis', {});
	expectType<Misskey.entities.EmojiDetailed>(detailed);
	expectType<Misskey.entities.EmojiSimple>(list.emojis[0]);
	expectType<string | null>(detailed.host);
	expectType<boolean | undefined>(list.emojis[0].localOnly);
});

test('queue operations and exports use the feature contract types', async () => {
	const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
	expectType<null>(await cli.request('admin/queue/pause', { queue: 'db' }));
	expectType<null>(await cli.request('admin/queue/clear', { queue: 'inbox', state: 'failed' }));
	expectType<null>(await cli.request('admin/queue/retry-job', { queue: 'deliver', jobId: 'job' }));
	expectType<null>(await cli.request('i/export-notes'));
	expectType<null>(await cli.request('i/export-following', { excludeMuting: true }));
	// @ts-expect-error queue names are constrained by the contract
	cli.request('admin/queue/pause', { queue: 'unknown' });
	// @ts-expect-error clear requires a state
	cli.request('admin/queue/clear', { queue: 'db' });
	// @ts-expect-error retry requires a job id
	cli.request('admin/queue/retry-job', { queue: 'db' });
	// @ts-expect-error following export filter must be boolean
	cli.request('i/export-following', { excludeMuting: 'yes' });
});

test('chat, collection, emoji administration and notification commands derive from contracts', async () => {
	const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
	expectType<null>(await cli.request('chat/read-all'));
	expectType<null>(await cli.request('chat/rooms/mute', { roomId: 'room1', mute: true }));
	expectType<null>(await cli.request('chat/messages/react', { messageId: 'message1', reaction: '👍' }));
	expectType<null>(await cli.request('clips/add-note', { clipId: 'clip1', noteId: 'note1' }));
	expectType<null>(await cli.request('admin/emoji/set-category-bulk', { ids: [], category: null }));
	expectType<null>(await cli.request('admin/emoji/add-aliases-bulk', { ids: ['emoji1'], aliases: [] }));
	expectType<null>(await cli.request('notifications/create', { body: 'hello', header: null }));
	// @ts-expect-error room identifiers remain strings
	cli.request('chat/rooms/join', { roomId: 1 });
	// @ts-expect-error mute is a required boolean
	cli.request('chat/rooms/mute', { roomId: 'room1' });
	// @ts-expect-error note identifiers are required
	cli.request('clips/add-note', { clipId: 'clip1' });
	// @ts-expect-error ids are strings
	cli.request('admin/emoji/set-category-bulk', { ids: [1] });
	// @ts-expect-error notification body is required
	cli.request('notifications/create', { header: 'hello' });
});

test('list, announcement, decoration and webhook commands derive from contracts', async () => {
	const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
	expectType<null>(await cli.request('users/lists/update-membership', { listId: 'list1', userId: 'user1', withReplies: false }));
	expectType<null>(await cli.request('users/lists/favorite', { listId: 'list1' }));
	expectType<null>(await cli.request('admin/avatar-decorations/update', { id: 'decoration1', category: null }));
	expectType<null>(await cli.request('admin/announcements/update', { id: 'announcement1', imageUrl: null, icon: 'info' }));
	expectType<null>(await cli.request('i/read-announcement', { announcementId: 'announcement1' }));
	expectType<null>(await cli.request('i/webhooks/update', { webhookId: 'hook1', secret: null, on: ['note'] }));
	// @ts-expect-error membership user is required
	cli.request('users/lists/update-membership', { listId: 'list1' });
	// @ts-expect-error decoration roles must be strings
	cli.request('admin/avatar-decorations/update', { id: 'decoration1', roleIdsThatCanBeUsedThisDecoration: [1] });
	// @ts-expect-error announcement icons remain constrained
	cli.request('admin/announcements/update', { id: 'announcement1', icon: 'unknown' });
	// @ts-expect-error webhook events remain constrained
	cli.request('i/webhooks/update', { webhookId: 'hook1', on: ['unknown'] });
});

test('channel interactions and clip favorites derive from contracts', async () => {
	const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
	expectType<null>(await cli.request('channels/follow', { channelId: 'channel1' }));
	expectType<null>(await cli.request('channels/unfavorite', { channelId: 'channel1' }));
	expectType<null>(await cli.request('channels/mute/create', { channelId: 'channel1', expiresAt: null }));
	expectType<null>(await cli.request('channels/mute/create', { channelId: 'channel1', expiresAt: 1234 }));
	expectType<null>(await cli.request('clips/favorite', { clipId: 'clip1' }));
	expectType<null>(await cli.request('clips/unfavorite', { clipId: 'clip1' }));
	// @ts-expect-error channel id is required
	cli.request('channels/follow', {});
	// @ts-expect-error expiry remains a number or null
	cli.request('channels/mute/create', { channelId: 'channel1', expiresAt: 'tomorrow' });
	// @ts-expect-error clip id remains a string
	cli.request('clips/favorite', { clipId: 1 });
});

describe('canonical contract aliases', () => {
	test('named models and operation aliases use the same native response type', async () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		const me = await cli.request('i');
		expectType<Misskey.entities.MeDetailed>(me);
		expectType<Misskey.entities.IResponse>(me);
		expectType<Misskey.entities.ReversiMatchResponse>(await cli.request('reversi/match', { userId: 'user1' }));
	});
	test('declared request keys survive mapped-type operations', () => {
		const update: Omit<Misskey.entities.ClipsUpdateRequest, 'name'> = { clipId: 'clip1' };
		expectType<string>(update.clipId);
		expectNotAssignable<Omit<Misskey.entities.ClipsUpdateRequest, 'name'>>({});
	});
});

describe('native chart contracts', () => {
	test('all named chart aliases match APIClient and required numeric series', async () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		const result0 = await cli.request('charts/active-users', { span: 'day' });
		expectType<Misskey.entities.ChartsActiveUsersResponse>(result0);
		expectType<number[]>(result0.readWrite);
		const result1 = await cli.request('charts/ap-request', { span: 'day' });
		expectType<Misskey.entities.ChartsApRequestResponse>(result1);
		expectType<number[]>(result1.deliverSucceeded);
		const result2 = await cli.request('charts/drive', { span: 'day' });
		expectType<Misskey.entities.ChartsDriveResponse>(result2);
		expectType<number[]>(result2.local.incSize);
		const result3 = await cli.request('charts/federation', { span: 'day' });
		expectType<Misskey.entities.ChartsFederationResponse>(result3);
		expectType<number[]>(result3.pubsub);
		const result4 = await cli.request('charts/instance', { span: 'day', host: '' });
		expectType<Misskey.entities.ChartsInstanceResponse>(result4);
		expectType<number[]>(result4.notes.diffs.withFile);
		const result5 = await cli.request('charts/notes', { span: 'day' });
		expectType<Misskey.entities.ChartsNotesResponse>(result5);
		expectType<number[]>(result5.remote.diffs.reply);
		const result6 = await cli.request('charts/user/drive', { span: 'day', userId: 'user1' });
		expectType<Misskey.entities.ChartsUserDriveResponse>(result6);
		expectType<number[]>(result6.totalSize);
		const result7 = await cli.request('charts/user/following', { span: 'day', userId: 'user1' });
		expectType<Misskey.entities.ChartsUserFollowingResponse>(result7);
		expectType<number[]>(result7.local.followings.total);
		const result8 = await cli.request('charts/user/notes', { span: 'day', userId: 'user1' });
		expectType<Misskey.entities.ChartsUserNotesResponse>(result8);
		expectType<number[]>(result8.diffs.renote);
		const result9 = await cli.request('charts/user/pv', { span: 'day', userId: 'user1' });
		expectType<Misskey.entities.ChartsUserPvResponse>(result9);
		expectType<number[]>(result9.upv.visitor);
		const result10 = await cli.request('charts/user/reactions', { span: 'day', userId: 'user1' });
		expectType<Misskey.entities.ChartsUserReactionsResponse>(result10);
		expectType<number[]>(result10.remote.count);
		const result11 = await cli.request('charts/users', { span: 'day' });
		expectType<Misskey.entities.ChartsUsersResponse>(result11);
		expectType<number[]>(result11.local.total);
	});
	test('chart requests retain optional defaults and required route-specific fields', () => {
		const cli = new Misskey.api.APIClient({ origin: 'https://misskey.test' });
		const request: Misskey.entities.ChartsUsersRequest = { span: 'hour', offset: null };
		expectType<number | null | undefined>(request.offset);
		const instance: Pick<Misskey.entities.ChartsInstanceRequest, 'host' | 'span'> = { span: 'day', host: '' };
		expectType<string>(instance.host);
		expectNotAssignable<Misskey.entities.ChartsUserNotesRequest>({ span: 'day' });
		expectNotAssignable<Misskey.entities.ChartsUsersResponse>({ local: { total: [], inc: [], dec: [] } });
		// @ts-expect-error chart span is required
		cli.request('charts/users', {});
		// @ts-expect-error chart span remains constrained
		cli.request('charts/users', { span: 'week' });
		// @ts-expect-error instance chart host remains required
		cli.request('charts/instance', { span: 'day' });
		// @ts-expect-error user charts require a user identifier
		cli.request('charts/user/pv', { span: 'day' });
		// @ts-expect-error chart offsets remain numbers or null
		cli.request('charts/users', { span: 'day', offset: 'today' });
	});
});
