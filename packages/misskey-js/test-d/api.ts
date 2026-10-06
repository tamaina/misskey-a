import type { Endpoints as LegacyEndpoints } from '../src/autogen/endpoint.js';
import { describe, test } from 'vitest';
import { expectType } from 'tsd';
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
	expectType<void>(await cli.request('admin/queue/pause', { queue: 'db' }));
	expectType<void>(await cli.request('admin/queue/clear', { queue: 'inbox', state: 'failed' }));
	expectType<void>(await cli.request('admin/queue/retry-job', { queue: 'deliver', jobId: 'job' }));
	expectType<void>(await cli.request('i/export-notes'));
	expectType<void>(await cli.request('i/export-following', { excludeMuting: true }));
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
	expectType<void>(await cli.request('chat/read-all'));
	expectType<void>(await cli.request('chat/rooms/mute', { roomId: 'room1', mute: true }));
	expectType<void>(await cli.request('chat/messages/react', { messageId: 'message1', reaction: '👍' }));
	expectType<void>(await cli.request('clips/add-note', { clipId: 'clip1', noteId: 'note1' }));
	expectType<void>(await cli.request('admin/emoji/set-category-bulk', { ids: [], category: null }));
	expectType<void>(await cli.request('admin/emoji/add-aliases-bulk', { ids: ['emoji1'], aliases: [] }));
	expectType<void>(await cli.request('notifications/create', { body: 'hello', header: null }));
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
