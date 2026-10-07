/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Compile-only proof. The root aggregate owns compiler execution; never execute this file.
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import type { MiLocalUser } from '../../../features/users/backend/models/User.js';
import type { MiAccessToken } from '../../../features/auth/backend/models/AccessToken.js';
import { channelContract, channelInputs } from '../../../features/channels/contract/index.js';
import { clipFavoriteContract, clipFavoriteInputs } from '../../../features/collections/contract/index.js';
import { portabilityContract } from '../../../features/portability/contract/index.js';
import { createContractTransportEndpoint } from '../../src/server/api/contract-transport-endpoint.js';
import type { EndpointExecutor } from '../../src/server/api/endpoint-base.js';
import type { createEndpoint as createFollow } from '../../../features/channels/backend/endpoints/channels/follow.js';
import type { createEndpoint as createFavorite } from '../../../features/collections/backend/endpoints/clips/favorite.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
const anonymousMeta = { requireCredential: false } as const;
const authenticatedMeta = { requireCredential: true, kind: 'write:channels' } as const;
const exportMeta = { secure: true, requireCredential: true } as const;

export type ContractTransportTypeAssertions = [
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof createFollow>['exec']>>, void>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof createFavorite>['exec']>>, void>>,
	Assert<Equal<Parameters<EndpointExecutor<typeof authenticatedMeta, v.InferOutput<typeof channelInputs['channels/follow']>, void>>[0], v.InferOutput<typeof channelInputs['channels/follow']>>>,
	Assert<Equal<Parameters<EndpointExecutor<typeof authenticatedMeta, unknown, void>>[1], MiLocalUser>>,
	Assert<Equal<Parameters<EndpointExecutor<typeof anonymousMeta, unknown, void>>[1], MiLocalUser | null>>,
	Assert<Equal<Parameters<EndpointExecutor<typeof anonymousMeta, unknown, void>>[2], MiAccessToken | null>>,
	Assert<Equal<IsAny<v.InferOutput<typeof clipFavoriteInputs['clips/favorite']>>, false>>,
];

if (false) {
	createContractTransportEndpoint(authenticatedMeta, {}, channelContract['channels/follow'], async (params, user, token, file, cleanup, ip, headers) => {
		const id: string = params.channelId;
		const actor: MiLocalUser = user;
		const accessToken: MiAccessToken | null = token;
		const opaque: unknown = params.extra;
		const name: string | null | undefined = file?.name;
		const path: string | undefined = file?.path;
		const remoteAddress: string | null | undefined = ip;
		const requestHeaders: Record<string, string> | null | undefined = headers;
		cleanup?.();
		void [id, actor, accessToken, opaque, name, path, remoteAddress, requestHeaders];
		// @ts-expect-error A declared channel identifier cannot widen to number.
		const wrongId: number = params.channelId; void wrongId;
		// @ts-expect-error Unknown extra fields are not declared typed payload properties.
		const wrongExtra: string = params.extra; void wrongExtra;
	});
	createContractTransportEndpoint(anonymousMeta, {}, channelContract['channels/follow'], async (_params, user) => {
		const actor: MiLocalUser | null = user; void actor;
		// @ts-expect-error Anonymous transport preserves nullable user context.
		const requiredActor: MiLocalUser = user; void requiredActor;
	});
	createContractTransportEndpoint(authenticatedMeta, {}, clipFavoriteContract['clips/favorite'], async params => {
		const id: string = params.clipId; void id;
	});
	const authenticatedEndpoint = createContractTransportEndpoint(authenticatedMeta, {}, channelContract['channels/follow'], async () => {});
	// @ts-expect-error Required transport credentials cannot become a nullable exec actor.
	authenticatedEndpoint.exec({}, null, null);
	createContractTransportEndpoint(authenticatedMeta, {}, channelContract['channels/mute/create'], async params => {
		const expiration: number | null | undefined = params.expiresAt; void expiration;
		// @ts-expect-error The optional expiration does not widen to arbitrary JSON or string.
		const wrongExpiration: string = params.expiresAt; void wrongExpiration;
	});
	// @ts-expect-error The contract witness prevents an invalid void-route output from widening inference.
	createContractTransportEndpoint(authenticatedMeta, {}, channelContract['channels/follow'], async () => 123);
	// @ts-expect-error An explicitly mistyped callback cannot widen the native channel input.
	createContractTransportEndpoint(authenticatedMeta, {}, channelContract['channels/follow'], async (_params: { channelId: number }) => {});

	const defaultContract = oc.input(v.object({ count: v.optional(v.number(), 7) })).output(v.number());
	const defaultEndpoint = createContractTransportEndpoint(anonymousMeta, {}, defaultContract, async params => {
		const count: number = params.count;
		// @ts-expect-error Handler input is parsed schema output, not optional raw client input.
		const missing: undefined = params.count; void missing;
		return count;
	});
	const result: Promise<number> = defaultEndpoint.exec({}, null, null); void result;
	// @ts-expect-error Output inference remains number, even when the caller wants string.
	const wrongResult: Promise<string> = defaultEndpoint.exec({}, null, null); void wrongResult;
	// @ts-expect-error A callback result cannot widen the contract's declared numeric output.
	createContractTransportEndpoint(anonymousMeta, {}, defaultContract, async () => 'invalid');

	createContractTransportEndpoint(exportMeta, {}, portabilityContract['i/export-following'], async params => {
		const muting: boolean = params.excludeMuting;
		const inactive: boolean = params.excludeInactive;
		void [muting, inactive];
		// @ts-expect-error The optional-root contract's defaulted post-parse input is not undefined.
		const absent: undefined = params; void absent;
	});

	// Limitation fixture only: this pairing is not valid for production forwarding.
	// Native output inference is honest, but the witness does not execute the transform.
	const transformed = oc.input(v.pipe(v.object({ value: v.string() }), v.transform(params => ({ value: params.value.length })))).output(v.void());
	createContractTransportEndpoint(anonymousMeta, {}, transformed, async params => {
		const nativeValue: number = params.value; void nativeValue;
		// @ts-expect-error Native output differs from the raw HTTP string accepted by an arbitrary schema.
		const rawValue: string = params.value; void rawValue;
	});
}
