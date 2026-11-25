/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as Reversi from 'misskey-reversi';
import { UserWebhookService } from '@features/integrations/backend/services/UserWebhookService.js';
import { ReversiService } from '../../backend/services/ReversiService.js';
import type { ReversiGameRepository, ReversiGameUpdateBuilder } from '../../backend/services/ReversiService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { MiReversiGame } from '../../backend/models/ReversiGame.js';
import type { ModuleRef } from '@nestjs/core';
import type { Redis } from 'ioredis';
import type { MiUser } from '@features/users/backend/models/User.js';

vi.mock('@features/integrations/backend/services/UserWebhookService.js', () => ({ UserWebhookService: class {} }));
vi.mock('@features/users/backend/services/CacheService.js', () => ({ CacheService: class {} }));
vi.mock('@features/users/backend/serializers/UserEntityService.js', () => ({ UserEntityService: class {} }));
vi.mock('@features/runtime/backend/services/GlobalEventService.js', () => ({ GlobalEventService: class {} }));
vi.mock('@features/runtime/backend/services/IdService.js', () => ({ IdService: class {} }));
vi.mock('@features/notifications/backend/services/NotificationService.js', () => ({ NotificationService: class {} }));
vi.mock('../../backend/serializers/ReversiGameEntityService.js', () => ({ ReversiGameEntityService: class {} }));

const black = { id: 'black' } as MiUser;
const white = { id: 'white' } as MiUser;
const map = Reversi.maps.eighteight.data;

function setup(board = map) {
	const game: MiReversiGame = { id: 'game1', user1Id: black.id, user2Id: white.id, user1Ready: true, user2Ready: true,
		isStarted: true, isEnded: false, black: 1, bw: '1', logs: [], map: board,
		isLlotheo: false, canPutEverywhere: false, loopedBoard: false, timeLimitForEachTurn: 60,
		startedAt: null, endedAt: null, user1: null, user2: null, winnerId: null, surrenderedUserId: null,
		timeoutUserId: null, noIrregularRules: false, form1: null, form2: null, crc32: null,
	};
	const cache = Promise.withResolvers<'OK'>();
	const timer = Promise.withResolvers<'OK'>();
	const redis = mockDeep<Redis>();
	redis.setex.mockImplementation(key => String(key).includes('turnTimer') ? timer.promise : cache.promise);
	const webhook = mockDeep<UserWebhookService>();
	const events = mockDeep<GlobalEventService>();
	const moduleRef = mockDeep<ModuleRef>();
	moduleRef.get.mockImplementation(token => {
		expect(token).toBe(UserWebhookService);
		return webhook;
	});
	const repo = mockDeep<ReversiGameRepository>();
	const update = mockDeep<ReversiGameUpdateBuilder>();
	let updated = game;
	repo.createQueryBuilder.mockReturnValue({ update: () => update });
	update.set.mockImplementation(patch => { updated = { ...game, ...patch }; return update; });
	update.where.mockReturnValue(update);
	update.returning.mockReturnValue(update);
	update.execute.mockImplementation(async () => ({ raw: [updated] }));
	const service = new ReversiService(moduleRef, redis, repo, mockDeep(), mockDeep(), events, mockDeep(), mockDeep());
	vi.spyOn(service, 'get').mockResolvedValue(game);
	const start = (value: MiReversiGame) => (service as unknown as { startGame(game: MiReversiGame): Promise<void> }).startGame(value);
	return { game, cache, timer, redis, webhook, service, events, start };
}

it.each([
	[map, 'black'],
	[['-bw'], 'white'],
] as const)('tries the native first actor after started without waiting before WebSocket (%s)', async (board, actor) => {
	const f = setup([...board]);
	await f.start({ ...f.game, isStarted: false, black: null });
	expect(f.events.publishReversiGameStream).toHaveBeenCalledWith('game1', 'started', expect.anything());
	expect(f.webhook.enqueueGameTurn).not.toHaveBeenCalled();
	f.cache.resolve('OK');
	await Promise.resolve();
	expect(f.webhook.enqueueGameTurn).not.toHaveBeenCalled();
	f.timer.resolve('OK');
	await expect.poll(() => f.webhook.enqueueGameTurn.mock.calls.length).toBe(1);
	expect(f.webhook.enqueueGameTurn).toHaveBeenCalledWith(actor, { game: 'reversi', gameId: 'game1', revision: 1 }, expect.any(Number), expect.stringMatching(/^[a-f0-9]{64}$/));
});

it.each([
	[map, 19, 'white'], // Standard opening.
	[['---w-wb'], 4, 'black'], // White has no move; the native engine keeps black.
] as const)('signals only the native next color after a legal move or automatic pass (%s)', async (board, pos, nextActor) => {
	const f = setup([...board]);
	await f.service.putStoneToGame('game1', white, pos, 'client-id');
	await f.service.putStoneToGame('game1', { id: 'spectator' } as MiUser, pos, 'client-id');
	await f.service.putStoneToGame('game1', black, -1, 'illegal');
	expect(f.events.publishReversiGameStream).not.toHaveBeenCalled();
	expect(f.webhook.enqueueGameTurn).not.toHaveBeenCalled();
	await f.service.putStoneToGame('game1', black, pos, 'private-client-id');
	expect(f.events.publishReversiGameStream).toHaveBeenCalledWith('game1', 'log', expect.objectContaining({ pos, id: 'private-client-id' }));
	expect(f.webhook.enqueueGameTurn).not.toHaveBeenCalled();
	f.timer.resolve('OK');
	f.cache.resolve('OK');
	await expect.poll(() => f.webhook.enqueueGameTurn.mock.calls.length).toBe(1);
	expect(f.webhook.enqueueGameTurn).toHaveBeenCalledWith(nextActor, { game: 'reversi', gameId: 'game1', revision: 2 }, expect.any(Number), expect.stringMatching(/^[a-f0-9]{64}$/));
});

it('preserves terminal WebSocket messages without opening an actionable turn', async () => {
	const terminal = setup(['-wb']);
	terminal.cache.resolve('OK');
	await terminal.service.putStoneToGame('game1', black, 0);
	expect(terminal.events.publishReversiGameStream.mock.calls.map(([, kind]) => kind)).toEqual(['log', 'ended']);
	expect(terminal.webhook.enqueueGameTurn).not.toHaveBeenCalled();
	const empty = setup(['bbb']);
	empty.cache.resolve('OK');
	await empty.start({ ...empty.game, isStarted: false, black: null });
	expect(empty.events.publishReversiGameStream.mock.calls.map(([, kind]) => kind)).toEqual(['ended']);
	expect(empty.webhook.enqueueGameTurn).not.toHaveBeenCalled();
});

it('keeps the existing WebSocket occurrence but drops the webhook if the cache write failed', async () => {
	const f = setup();
	const report = vi.spyOn(console, 'error').mockImplementation(() => {});
	try {
		await f.service.putStoneToGame('game1', black, 19);
		expect(f.events.publishReversiGameStream).toHaveBeenCalledWith('game1', 'log', expect.anything());
		f.timer.resolve('OK');
		f.cache.reject(new Error('synthetic Redis failure'));
		await expect.poll(() => report.mock.calls.length).toBe(1);
		expect(f.webhook.enqueueGameTurn).not.toHaveBeenCalled();
	} finally {
		report.mockRestore();
	}
});
