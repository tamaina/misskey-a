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
	expectType<string>(result[0].id);
	expectType<string[]>(result[0].roleIdsThatCanBeUsedThisDecoration);
	expectType<string | null | undefined>(result[0].category);
});
