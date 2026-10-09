/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedReversiGameDetailed } from '../../backend/reversi.schema.js';
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { packedReversiGameDetailedSchema } from '../../backend/reversi.schema.js';
import { packedReversiGameLiteSchema } from '../../backend/reversi.schema.js';
import { reversiMatchContract } from '../../backend/endpoints/reversi/match.contract.js';

import { reversiMatchContract as packedReversiMatchDefinition } from '../../backend/endpoints/reversi/match.contract.js';
import { reversiVerifyContract } from '../../backend/endpoints/reversi/verify.contract.js';
import { bubbleGameRankingContract } from '../../backend/endpoints/bubble-game/ranking.contract.js';
import { bubbleGameRegisterContract } from '../../backend/endpoints/bubble-game/register.contract.js';
import { reversiInvitationsContract } from '../../backend/endpoints/reversi/invitations.contract.js';
import { ReversiGameEntityService } from '../../backend/serializers/ReversiGameEntityService.js';
import { createRouterClient } from '@orpc/server';
import { createBubbleGameRankingProcedure } from '../../backend/endpoints/bubble-game/ranking.js';
import type { BubbleGameRankingDependencies } from '../../backend/endpoints/bubble-game/ranking.js';
import type { ApiContext, ApiServices } from '../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import { createReversiVerifyProcedure } from '../../backend/endpoints/reversi/verify.js';
import type { ReversiVerifyDependencies } from '../../backend/endpoints/reversi/verify.js';
import { MiReversiGame } from '../../backend/models/ReversiGame.js';
import type { MiBubbleGameRecord } from '../../backend/models/BubbleGameRecord.js';
import type { MiUser } from '@features/users/backend/models/User.js';
const packedBubbleGameRankingOutput = requiredSchema(bubbleGameRankingContract['~orpc'].outputSchema);

function requiredSchema<T>(schema: T | undefined): T {
	if (schema === undefined) throw new Error('Expected contract schema');
	return schema;
}

const packedReversiMatchInput = requiredSchema(reversiMatchContract['~orpc'].inputSchema);
const packedReversiMatchOutput = requiredSchema(reversiMatchContract['~orpc'].outputSchema);
const packedReversiVerifyOutput = requiredSchema(reversiVerifyContract['~orpc'].outputSchema);
const voidBubbleGameRegisterInput = requiredSchema(bubbleGameRegisterContract['~orpc'].inputSchema);
const emptyReversiInvitationsInput = requiredSchema(reversiInvitationsContract['~orpc'].inputSchema);

const date = new Date('2026-01-01T00:00:00Z');
const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

function fixture() {
	const users = mockDeep<ConstructorParameters<typeof ReversiGameEntityService>[1]>();
	users.pack.mockImplementation(async src => ({ ...user, id: typeof src === 'string' ? src : src.id }));
	const ids = mockDeep<ConstructorParameters<typeof ReversiGameEntityService>[2]>();
	ids.parse.mockReturnValue({ date });
	const service = new ReversiGameEntityService(mockDeep(), users, ids);
	const game: MiReversiGame = Object.assign(new MiReversiGame(), { id: 'game123', startedAt: null, endedAt: null, isStarted: false, isEnded: false, form1: null, form2: null, user1Ready: false, user2Ready: false, user1Id: user.id, user2Id: 'other123', user1: null, user2: null, winnerId: null, surrenderedUserId: null, timeoutUserId: null, black: null, bw: 'invalid', noIrregularRules: false, isLlotheo: false, canPutEverywhere: false, loopedBoard: false, timeLimitForEachTurn: 90, logs: [], map: ['--------'], crc32: null });
	return { service, game };
}

test('actual Reversi serializers retain nullable state, winner, surrender, timeout and bw fallback', async () => {
	const { service, game } = fixture();
	const pending = await service.packDetail(game);
	checkClosed(packedReversiGameDetailedSchema, pending, 'user1Ready', { logs: [['wrong']] });
	expect(pending.bw).toBe('random');
	expect(pending.winner).toBeNull();
	expect(v.parse(packedReversiMatchOutput, undefined)).toBeUndefined();
	game.startedAt = date; game.endedAt = date; game.isStarted = true; game.isEnded = true;
	game.winnerId = user.id; game.surrenderedUserId = 'other123'; game.timeoutUserId = 'other123'; game.bw = '1'; game.black = 1;
	game.logs = [[0, 1, 2], []];
	game.form1 = { saved: [1, { nested: true }] }; game.form2 = { custom: 'value' };
	const detailed = await service.packDetail(game);
	checkClosed(packedReversiGameDetailedSchema, detailed, 'form1', { bw: 'invalid' });
	expect(v.parse(packedReversiGameDetailedSchema, detailed).form1).toEqual(game.form1);
	expect(detailed.form1).toEqual(game.form1);
	expect(detailed.winner?.id).toBe(user.id);
	const lite = await service.packLite(game);
	checkClosed(packedReversiGameLiteSchema, lite, 'isStarted', { black: '1' });
	expect(lite.startedAt).toBe(date.toISOString());
	expect(lite.timeoutUserId).toBe('other123');
});

// Establish each saved-form boundary independently; the other form stays null.
// Saved forms are genuine JSON, including historical arrays and scalar values.
test.each([
	{ field: 'form1' as const, saved: [1, 'saved'], accepted: true },
	{ field: 'form2' as const, saved: [1, 'saved'], accepted: true },
	{ field: 'form1' as const, saved: 'saved scalar', accepted: true },
	{ field: 'form2' as const, saved: 'saved scalar', accepted: true },
])('retained saved-form boundary for $field=$saved', async ({ field, saved, accepted }) => {
	const { service, game } = fixture();
	game[field] = saved;
	const output = await service.packDetail(game);
	expect(output[field]).toEqual(saved);
	expect(output[field === 'form1' ? 'form2' : 'form1']).toBeNull();
	expect(v.safeParse(packedReversiGameDetailedSchema.entries[field], saved).success).toBe(accepted);
	expect(v.safeParse(packedReversiGameDetailedSchema, output).success).toBe(accepted);
});

test.each([false, true])('actual verify handler preserves desynced=%s variants', async desynced => {
	const { service, game } = fixture();
	const reversi = mockDeep<ReversiVerifyDependencies['reversiService']>();
	reversi.checkCrc.mockResolvedValue(desynced ? game : null);
	const client = createRouterClient({ verify: createReversiVerifyProcedure({ reversiService: reversi, reversiGameEntityService: service }) }, { context: anonymousContext() });
	const result = await client.verify({ gameId: game.id, crc32: 'crc' });
	expect(v.safeParse(packedReversiVerifyOutput, result).success).toBe(true);
	expect(result.desynced).toBe(desynced);
	checkClosed(packedReversiVerifyOutput, result, 'desynced', { desynced: 7 });
});

test.each([false, true])('actual ranking handler retains missing packed user=%s and closes wrapper', async missingUser => {
	const records = mockDeep<BubbleGameRankingDependencies['bubbleGameRecordsRepository']>();
	records.find.mockResolvedValue([mockDeep<MiBubbleGameRecord>({ id: 'record123', score: 9, user: mockDeep<MiUser>({ id: user.id }) })]);
	const users = mockDeep<BubbleGameRankingDependencies['userEntityService']>();
	users.packMany.mockResolvedValue(missingUser ? [] : [user]);
	const client = createRouterClient({ ranking: createBubbleGameRankingProcedure({ bubbleGameRecordsRepository: records, userEntityService: users }) }, { context: anonymousContext() });
	const result = await client.ranking({ gameMode: 'normal' });
	expect(v.safeParse(packedBubbleGameRankingOutput, result).success).toBe(true);
	expect(result[0].user).toEqual(missingUser ? undefined : user);
	expect(Object.hasOwn(result[0], 'user')).toBe(true);
	for (const value of [{ ...result[0], future: true }, { score: 9 }, { ...result[0], score: '9' }]) expect(v.safeParse(packedBubbleGameRankingOutput, [value]).success).toBe(false);
});

test('native game defaults, empty invitation JSON and finite responses retain wire semantics', async () => {
	expect(v.parse(packedReversiMatchInput, { future: true })).toEqual({ noIrregularRules: false, multiple: false });
	for (const value of [{ userId: 7 }, { multiple: null }]) expect(v.safeParse(packedReversiMatchInput, value).success).toBe(false);
	const register = { score: 0, seed: 'seed', logs: [[1, 2]], gameMode: 'normal', gameVersion: 1 };
	expect(v.parse(voidBubbleGameRegisterInput, { ...register, future: true })).toEqual(register);
	for (const value of [{ ...register, score: -1 }, { ...register, logs: [['bad']] }, {}]) expect(v.safeParse(voidBubbleGameRegisterInput, value).success).toBe(false);
	for (const value of [null, [], 7, 'ignored']) expect(v.safeParse(emptyReversiInvitationsInput, value).success).toBe(true);
	const { service, game } = fixture();
	const response = { ...await service.packDetail(game), future: true };
	const params = { future: true };
	expect(v.safeParse(packedReversiMatchOutput, response).success).toBe(false);
	expect(v.safeParse(packedReversiMatchInput, { multiple: 7 }).success).toBe(false);
});

function anonymousContext(): ApiContext<MiLocalUser> {
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([null, null]);
	return { services, credential: null, headers: {}, ip: '127.0.0.1' };
}

test('Reversi DTO selection strips outer and nested producer secrets while retaining saved JSON', async () => {
	const { service, game } = fixture();
	game.form1 = { extension: ['retained', { constructor: 'business-value' }] };
	const packed = await service.packDetail(game);
	const producer = {
		...packed, privateToken: 'outer-secret',
		user1: { ...packed.user1, privateToken: 'nested-secret', email: 'private@example.test' },
	};
	const selected = toPackedReversiGameDetailed(producer);
	expect(selected).not.toHaveProperty('privateToken');
	expect(selected.user1).not.toHaveProperty('privateToken');
	expect(selected.user1).not.toHaveProperty('email');
	expect(selected.form1).toEqual(game.form1);
});
