/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { DataSource, Repository } from 'typeorm';
import { api as sdkApi } from 'misskey-js';
import type { entities } from 'misskey-js';
import { MiUser } from '@features/users/backend/models/User.js';
import { api, castAsError, initTestDb, port, role, signup } from '../utils.js';

describe('remote suspension API visibility', () => {
	let connection: DataSource;
	let users: Repository<MiUser>;
	let root: entities.SignupResponse;
	let ordinary: entities.SignupResponse;
	let moderator: entities.SignupResponse;
	let remote: entities.SignupResponse;
	let available: entities.SignupResponse;
	let moderatorClient: sdkApi.APIClient;
	let ordinaryClient: sdkApi.APIClient;
	const host = 'remote-suspension.invalid';

	beforeAll(async () => {
		connection = await initTestDb(true);
		users = connection.getRepository(MiUser);
		root = await signup({ username: 'root' });
		ordinary = await signup();
		moderator = await signup();
		remote = await signup();
		available = await signup();
		const moderatorRole = await role(root, { isModerator: true });
		expect((await api('admin/roles/assign', { userId: moderator.id, roleId: moderatorRole.id }, root)).status).toBe(204);
		// No remote network resolution: synthetic actors are looked up only by ID.
		await users.update(remote.id, { host, isSuspended: false, isRemoteSuspended: true });
		await users.update(available.id, { host, isSuspended: false, isRemoteSuspended: false });
		moderatorClient = new sdkApi.APIClient({ origin: `http://127.0.0.1:${port}`, credential: moderator.token });
		ordinaryClient = new sdkApi.APIClient({ origin: `http://127.0.0.1:${port}`, credential: ordinary.token });
	}, 120000);

	afterAll(async () => {
		// Keep cleanup scoped to this suite's synthetic actors; the harness owns schema resets.
		if (users && remote && available) await users.delete([remote.id, available.id]);
		if (connection?.isInitialized) await connection.destroy();
	});

	test('single ordinary and unauthenticated lookups retain NO_SUCH_USER envelope', async () => {
		for (const viewer of [undefined, ordinary]) {
			const result = await api('users/show', { userId: remote.id }, viewer);
			expect(result.status).toBe(404);
			expect(castAsError(result.body).error).toMatchObject({ code: 'NO_SUCH_USER', kind: 'client' });
		}
	});

	test('ordinary SDK bulk lookup drops remote-only suspended actors and preserves available actors', async () => {
		const result = await ordinaryClient.request('users/show', { userIds: [remote.id, available.id] });
		expect(result.map(user => user.id)).toEqual([available.id]);
	});

	test('moderator SDK single and bulk lookups expose the combined public suspended state', async () => {
		const single = await moderatorClient.request('users/show', { userId: remote.id });
		expect(single).toMatchObject({ id: remote.id, isSuspended: true });
		expect(single).not.toHaveProperty('isRemoteSuspended');
		const bulk = await moderatorClient.request('users/show', { userIds: [remote.id, available.id] });
		expect(bulk.map(user => user.id)).toEqual([remote.id, available.id]);
		expect(bulk[0].isSuspended).toBe(true);
		expect(bulk[1].isSuspended).toBe(false);
	});

	test('admin DTO distinguishes remote suspension and still enforces moderator permission', async () => {
		const result = await moderatorClient.request('admin/show-user', { userId: remote.id });
		expect(result).toMatchObject({ isSuspended: false, isRemoteSuspended: true });
		expect(typeof result.isRemoteSuspended).toBe('boolean');
		const forbidden = await api('admin/show-user', { userId: remote.id }, ordinary);
		expect(forbidden.status).toBe(403);
	});

	test('retained public users list excludes remote-only suspended actors', async () => {
		const result = await ordinaryClient.request('users', { origin: 'remote', hostname: host, limit: 100 });
		expect(result.map(user => user.id)).toEqual([available.id]);
	});
});
