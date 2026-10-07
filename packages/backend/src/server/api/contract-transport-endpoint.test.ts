/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { createProcedureClient, implement } from '@orpc/server';
import * as v from 'valibot';
import { expect, test, vi } from 'vitest';
import { channelContract, channelInputs } from '@features/channels/contract';
import { clipFavoriteInputs } from '@features/collections/contract';
import { portabilityContract } from '@features/portability/contract';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiFeatures } from '@features/index/backend/feature-providers.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import * as clipFavorite from '@features/collections/backend/endpoints/clips/favorite.js';
import * as clipUnfavorite from '@features/collections/backend/endpoints/clips/unfavorite.js';
import * as channelFollow from '@features/channels/backend/endpoints/channels/follow.js';
import * as channelUnfollow from '@features/channels/backend/endpoints/channels/unfollow.js';
import * as channelFavorite from '@features/channels/backend/endpoints/channels/favorite.js';
import * as channelUnfavorite from '@features/channels/backend/endpoints/channels/unfavorite.js';
import * as channelMuteCreate from '@features/channels/backend/endpoints/channels/mute/create.js';
import * as channelMuteDelete from '@features/channels/backend/endpoints/channels/mute/delete.js';
import * as exportFollowing from '@features/portability/backend/endpoints/i/export-following.js';

type ForwardedHandler = (params: unknown, options?: unknown) => Promise<void>;

function channels(handler: ForwardedHandler): ApiFeatures['channelCommands'] {
	return {
		'channels/follow': handler,
		'channels/unfollow': handler,
		'channels/favorite': handler,
		'channels/unfavorite': handler,
		'channels/mute/create': handler,
		'channels/mute/delete': handler,
	};
}

function clips(handler: ForwardedHandler): ApiFeatures['clipFavoriteCommands'] {
	return { 'clips/favorite': handler, 'clips/unfavorite': handler };
}

// Minimal trusted-user fixture; transport request bodies remain unknown and uncast.
const actor = { id: 'Actor1', marker: {} } as unknown as MiLocalUser;
const idProperty = { type: 'string', format: 'misskey:id' } as const;
const clipInput = { type: 'object', properties: { clipId: idProperty }, required: ['clipId'] } as const;
const channelInput = { type: 'object', properties: { channelId: idProperty }, required: ['channelId'] } as const;
const muteInput = {
	type: 'object',
	properties: {
		channelId: idProperty,
		expiresAt: {
			type: 'integer', nullable: true,
			description: 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.',
		},
	},
	required: ['channelId'],
} as const;

const rows = [
	{ route: 'clips/favorite', module: clipFavorite, input: clipInput, id: 'clipId', wholeActor: false, create: (handler: ForwardedHandler) => clipFavorite.createEndpoint(clips(handler)) },
	{ route: 'clips/unfavorite', module: clipUnfavorite, input: clipInput, id: 'clipId', wholeActor: false, create: (handler: ForwardedHandler) => clipUnfavorite.createEndpoint(clips(handler)) },
	{ route: 'channels/follow', module: channelFollow, input: channelInput, id: 'channelId', wholeActor: true, create: (handler: ForwardedHandler) => channelFollow.createEndpoint(channels(handler)) },
	{ route: 'channels/unfollow', module: channelUnfollow, input: channelInput, id: 'channelId', wholeActor: true, create: (handler: ForwardedHandler) => channelUnfollow.createEndpoint(channels(handler)) },
	{ route: 'channels/favorite', module: channelFavorite, input: channelInput, id: 'channelId', wholeActor: true, create: (handler: ForwardedHandler) => channelFavorite.createEndpoint(channels(handler)) },
	{ route: 'channels/unfavorite', module: channelUnfavorite, input: channelInput, id: 'channelId', wholeActor: true, create: (handler: ForwardedHandler) => channelUnfavorite.createEndpoint(channels(handler)) },
	{ route: 'channels/mute/create', module: channelMuteCreate, input: muteInput, id: 'channelId', wholeActor: true, create: (handler: ForwardedHandler) => channelMuteCreate.createEndpoint(channels(handler)) },
	{ route: 'channels/mute/delete', module: channelMuteDelete, input: channelInput, id: 'channelId', wholeActor: true, create: (handler: ForwardedHandler) => channelMuteDelete.createEndpoint(channels(handler)) },
] as const;

type AuthenticatedExecutor = { exec: (params: unknown, user: MiLocalUser, token: null) => Promise<unknown> };

async function outcome(endpoint: AuthenticatedExecutor, params: unknown) {
	try {
		return { result: await endpoint.exec(params, actor, null) };
	} catch (error) {
		if (!(error instanceof ApiError)) throw error;
		return { message: error.message, code: error.code, id: error.id, info: error.info };
	}
}

function bodyWithOpaqueKeys(id: string) {
	const opaque = { value: ['unchanged'] };
	return Object.defineProperties({ [id]: 'Object1', opaque, actor: { id: 'Forged1' } }, {
		['__proto__']: { value: opaque, enumerable: true, configurable: true, writable: true },
		constructor: { value: 'opaque constructor', enumerable: true, configurable: true, writable: true },
		prototype: { value: opaque, enumerable: true, configurable: true, writable: true },
	});
}

function forwardedActor(options: unknown): unknown {
	if (options === null || typeof options !== 'object' || !('context' in options)) throw new Error('Expected context options');
	const context = options.context;
	if (context === null || typeof context !== 'object' || !('actor' in context)) throw new Error('Expected context actor');
	return context.actor;
}

for (const row of rows) {
	test(`${row.route} retains native JSON constraints and declared post-validation values`, async () => {
		const native = row.id === 'clipId' ? clipFavoriteInputs[row.route] : channelInputs[row.route];
		const endpoint = row.create(async () => {});
		const samples = [
			{}, null, [], 'invalid', { [row.id]: 'Valid1' }, { [row.id]: '' },
			{ [row.id]: 'Invalid-ID' }, { [row.id]: '非ASCII' }, { [row.id]: 1 }, { [row.id]: null },
			{ [row.id]: 'Valid1', extra: { opaque: true }, actor: { id: 'Forged1' } },
			{ [row.id]: 'Valid1', expiresAt: null }, { [row.id]: 'Valid1', expiresAt: -1 },
			{ [row.id]: 'Valid1', expiresAt: 123 }, { [row.id]: 'Valid1', expiresAt: 1.5 },
			{ [row.id]: 'Valid1', expiresAt: '123' },
		];
		for (const params of samples) {
			const parsed = v.safeParse(native, params);
			const result = await outcome(endpoint, structuredClone(params));
			expect(parsed.success).toBe('result' in result);
			if (parsed.success) {
				if (params === null || typeof params !== 'object') throw new Error('Expected validated object input');
				expect(typeof Reflect.get(parsed.output, row.id)).toBe('string');
				expect(parsed.output).toMatchObject({ [row.id]: Reflect.get(params, row.id) });
			}
		}
		// Frozen HTTP inputs have no defaults; neither the IDs nor expiration are normalized.
		expect(JSON.stringify(row.input)).not.toContain('"default"');
	});

	test(`${row.route} keeps its frozen input, callback body and trusted context`, async () => {
		expect(row.module.paramDef).toEqual(row.input);
		const handler = vi.fn<ForwardedHandler>(async () => {});
		const endpoint = row.create(handler);
		const before = new Endpoint(row.module.meta, row.input, async (params: unknown, user) => handler(params, {
			context: { actor: row.wholeActor ? user : { id: user.id } },
		}));
		const nativeBody = bodyWithOpaqueKeys(row.id);
		const oldBody = bodyWithOpaqueKeys(row.id);
		const opaque = nativeBody.opaque;
		const prototype = Object.getPrototypeOf(nativeBody);
		const keys = Object.keys(nativeBody);

		expect(await outcome(endpoint, nativeBody)).toEqual(await outcome(before, oldBody));
		expect(handler).toHaveBeenCalledTimes(2);
		expect(handler.mock.calls[0][0]).toBe(nativeBody);
		expect(handler.mock.calls[1][0]).toBe(oldBody);
		expect(handler.mock.calls[0][1]).toEqual(handler.mock.calls[1][1]);
		expect(nativeBody.opaque).toBe(opaque);
		expect(Object.getPrototypeOf(nativeBody)).toBe(prototype);
		expect(Object.keys(nativeBody)).toEqual(keys);
		expect(Object.getOwnPropertyDescriptor(nativeBody, '__proto__')?.value).toBe(opaque);
		if (row.wholeActor) expect(forwardedActor(handler.mock.calls[0][1])).toBe(actor);
		else {
			expect(forwardedActor(handler.mock.calls[0][1])).toEqual({ id: actor.id });
			expect(forwardedActor(handler.mock.calls[0][1])).not.toBe(actor);
		}
	});

	test(`${row.route} retains exact AJV first errors and suppresses delegation`, async () => {
		const handler = vi.fn<ForwardedHandler>(async () => {});
		const endpoint = row.create(handler);
		const before = new Endpoint(row.module.meta, row.input, async (_params: unknown) => {});
		for (const params of [null, [], 'invalid', undefined, {}, { [row.id]: 1 }, { [row.id]: 'not-an-id' }, { [row.id]: null }]) {
			const current = await outcome(endpoint, params);
			expect(current).toEqual(await outcome(before, params));
			expect(current).toMatchObject({
				message: 'Invalid param.', code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532',
			});
		}
		expect(handler).not.toHaveBeenCalled();
	});

	test(`${row.route} passes inherited fields on the original body`, async () => {
		const handler = vi.fn<ForwardedHandler>(async () => {});
		const endpoint = row.create(handler);
		const params = Object.create({ [row.id]: 'Inherited1', opaque: { nested: true } });
		await expect(endpoint.exec(params, actor, null)).resolves.toBeUndefined();
		expect(handler.mock.calls[0][0]).toBe(params);
		expect(Object.keys(params)).toEqual([]);
	});

	test(`${row.route} preserves the feature rejection's original identity`, async () => {
		const failure = new Error('Feature failure');
		const handler = vi.fn<ForwardedHandler>(async () => { throw failure; });
		const endpoint = row.create(handler);
		const params = { [row.id]: 'Object1' };
		await expect(endpoint.exec(params, actor, null)).rejects.toBe(failure);
		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler.mock.calls[0][0]).toBe(params);
	});
}

test('channel mute keeps missing, undefined, null and integer expiration behavior', async () => {
	const handler = vi.fn<ForwardedHandler>(async () => {});
	const endpoint = channelMuteCreate.createEndpoint(channels(handler));
	const before = new Endpoint(channelMuteCreate.meta, muteInput, async (_params: unknown) => {});
	for (const params of [
		{ channelId: 'Channel1' }, { channelId: 'Channel1', expiresAt: undefined },
		{ channelId: 'Channel1', expiresAt: null }, { channelId: 'Channel1', expiresAt: -1 },
		{ channelId: 'Channel1', expiresAt: 123 }, { channelId: 'Channel1', expiresAt: 1.5 },
		{ channelId: 'Channel1', expiresAt: '123' },
	]) {
		const current = await outcome(endpoint, params);
		expect(current).toEqual(await outcome(before, structuredClone(params)));
	}
	const calls = handler.mock.calls;
	expect(calls).toHaveLength(5);
	for (const [params] of calls) expect(params).toHaveProperty('channelId', 'Channel1');
});

test('the existing exact-optional native expiry still rejects own undefined after HTTP acceptance', async () => {
	// This JavaScript-only discrepancy predates the pilot and remains at the existing feature boundary.
	const params = { channelId: 'Channel1', expiresAt: undefined };
	const endpoint = channelMuteCreate.createEndpoint(channels(async () => {}));
	await expect(endpoint.exec(params, actor, null)).resolves.toBeUndefined();
	expect(v.safeParse(channelInputs['channels/mute/create'], params).success).toBe(false);
});

test('before and after forwarding retain the own-undefined native procedure rejection identity', async () => {
	let delegated = 0;
	let nativeHandlerCalls = 0;
	const rejections: unknown[] = [];
	const procedure = createProcedureClient(implement(channelContract['channels/mute/create'])
		.$context<{ actor: MiLocalUser }>()
		.handler(async () => { nativeHandlerCalls++; }), {
		context: (context: { actor: MiLocalUser }) => context,
	});
	const commands: ApiFeatures['channelCommands'] = {
		...channels(async () => {}),
		'channels/mute/create': async (params, options) => {
			delegated++;
			try {
				return await procedure(params, options);
			} catch (error) {
				rejections.push(error);
				throw error;
			}
		},
	};
	const current = channelMuteCreate.createEndpoint(commands);
	const before = new Endpoint(channelMuteCreate.meta, channelMuteCreate.paramDef, async (params: { channelId: string; expiresAt?: number | null }, user) =>
		commands['channels/mute/create'](params, { context: { actor: user } }));
	for (const endpoint of [before, current]) {
		const params = { channelId: 'Channel1', expiresAt: undefined };
		const [result] = await Promise.allSettled([endpoint.exec(params, actor, null)]);
		if (result.status !== 'rejected') throw new Error('Expected the existing native input rejection');
		expect(result.reason).toBe(rejections.at(-1));
		expect(result.reason).toMatchObject({ code: 'BAD_REQUEST' });
		expect(Object.hasOwn(params, 'expiresAt')).toBe(true);
		expect(params.expiresAt).toBeUndefined();
	}
	expect(delegated).toBe(2);
	expect(nativeHandlerCalls).toBe(0);
});

test('a root-optional existing contract is only a witness and keeps HTTP object defaults/errors', async () => {
	const meta = exportFollowing.meta;
	const input = exportFollowing.paramDef;
	const snapshot = structuredClone(input);
	const calls: unknown[] = [];
	const endpoint = createContractTransportEndpoint(meta, input, portabilityContract['i/export-following'], async params => {
		calls.push(params);
		expect(params.excludeMuting).toBe(false);
		expect(params.excludeInactive).toBe(false);
	});
	const before = new Endpoint(meta, input, async (_params: unknown) => {});
	const currentBody = { opaque: {} };
	const beforeBody = { opaque: {} };
	expect(await outcome(endpoint, currentBody)).toEqual(await outcome(before, beforeBody));
	expect(calls).toEqual([currentBody]);
	expect(calls[0]).toBe(currentBody);
	expect(currentBody).toEqual(beforeBody);
	expect(currentBody).toMatchObject({ excludeMuting: false, excludeInactive: false });
	for (const params of [undefined, null, [], { excludeMuting: 'false' }]) {
		const currentInput = structuredClone(params);
		const beforeInput = structuredClone(params);
		expect(await outcome(endpoint, currentInput)).toEqual(await outcome(before, beforeInput));
		expect(currentInput).toEqual(beforeInput);
	}
	expect(calls).toHaveLength(1);
	expect(input).toEqual(snapshot);
	const nativeInput = portabilityContract['i/export-following']['~orpc'].inputSchema;
	if (nativeInput === undefined) throw new Error('Expected existing contract input');
	expect(v.safeParse(nativeInput, undefined).success).toBe(true);
});

test('AJV defaults and returned payload identity survive without native parsing', async () => {
	const input = {
		type: 'object', properties: { count: { type: 'number', default: 7 }, required: { type: 'string' } }, required: ['required'],
	} as const;
	const contract = oc.input(v.object({ count: v.optional(v.number(), 7), required: v.string() })).output(v.object({ count: v.number() }));
	const payload = { count: 7, extra: { preserve: true } };
	const calls: unknown[] = [];
	const endpoint = createContractTransportEndpoint({}, input, contract, async params => {
		calls.push(params);
		return payload;
	});
	const before = new Endpoint({}, input, async (_params: unknown) => payload);
	const currentBody = { required: 'ok', opaque: {} };
	const beforeBody = { required: 'ok', opaque: {} };
	expect(await endpoint.exec(currentBody, null, null)).toBe(payload);
	expect(await before.exec(beforeBody, null, null)).toBe(payload);
	expect(calls[0]).toBe(currentBody);
	expect(currentBody).toEqual(beforeBody);
	expect(currentBody).toMatchObject({ count: 7 });
	expect(payload.extra).toEqual({ preserve: true });
	const rejectedCurrent = { required: 123, opaque: {} };
	const rejectedBefore = { required: 123, opaque: {} };
	const [current, original] = await Promise.allSettled([
		endpoint.exec(rejectedCurrent, null, null), before.exec(rejectedBefore, null, null),
	]);
	expect(current).toEqual(original);
	expect(rejectedCurrent).toEqual(rejectedBefore);
	expect(rejectedCurrent).toMatchObject({ count: 7 });
	expect(calls).toHaveLength(1);
});

test('native output schemas do not validate or rewrite a dynamic forwarding result', async () => {
	const contract = oc.input(v.object({})).output(v.number());
	let result = 1;
	const endpoint = createContractTransportEndpoint({}, { type: 'object' }, contract, async () => result);
	result = Number.NaN;
	expect(await endpoint.exec({}, null, null)).toBeNaN();
});

test('limitation: a type-changing native input transform is not an audited HTTP pairing', async () => {
	// Deliberately invalid pairing, used only to expose the witness-only boundary.
	const transformed = v.pipe(v.object({ value: v.string() }), v.transform(params => ({ value: params.value.length })));
	const contract = oc.input(transformed).output(v.void());
	const input = { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] } as const;
	const params = { value: 'unchanged' };
	let seen: unknown;
	const endpoint = createContractTransportEndpoint({}, input, contract, async value => { seen = value; });
	await endpoint.exec(params, null, null);
	expect(seen).toBe(params);
	expect(params.value).toBe('unchanged');
	// The native schema's output has a numeric value, but this transport does not execute it.
	if (seen === null || typeof seen !== 'object' || !('value' in seen)) throw new Error('Expected original body');
	expect(typeof seen.value).toBe('string');
});
