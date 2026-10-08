/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expectTypeOf } from 'vitest';
import * as v from 'valibot';
import { packedUserLiteSchema, packedUserDetailedNotMeOnlySchema, packedMeDetailedOnlySchema, packedUserDetailedNotMeSchema, packedMeDetailedSchema, packedUserDetailedSchema, packedUserSchema } from '@features/users/contract/packed.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { NativeUserLite, NativeUserDetailedNotMe, NativeUserDetailed, NativeMeDetailed } from '@features/users/backend/serializers/native-user.js';
import type { Packed } from '@features/index/contract/packed.js';

export function nativeUserProducerTypes(service: UserEntityService, user: MiUser) {
	expectTypeOf(service.pack(user)).toEqualTypeOf<Promise<NativeUserLite>>();
	expectTypeOf(service.pack(user, user, { schema: 'UserLite' })).toEqualTypeOf<Promise<NativeUserLite>>();
	expectTypeOf(service.pack(user, null, { schema: 'UserDetailedNotMe' })).toEqualTypeOf<Promise<NativeUserDetailedNotMe>>();
	expectTypeOf(service.pack(user, undefined, { schema: 'UserDetailed' })).toEqualTypeOf<Promise<NativeUserDetailedNotMe>>();
	expectTypeOf(service.pack(user, user, { schema: 'UserDetailedNotMe' })).toEqualTypeOf<Promise<NativeUserDetailed>>();
	expectTypeOf(service.packSelf(user, { includeSecrets: true })).toEqualTypeOf<Promise<NativeMeDetailed>>();
	expectTypeOf(service.packMany([user], null, { schema: 'UserDetailed' })).toEqualTypeOf<Promise<NativeUserDetailedNotMe[]>>();
	// @ts-expect-error A general viewer is not the explicit self capability used by secret producers.
	service.pack(user, user, { schema: 'MeDetailed', includeSecrets: true });
	// @ts-expect-error Generic selection cannot pretend an absent detailed option was supplied.
	service.pack<'MeDetailed'>(user);
}

type NativeKey = NonNullable<NativeMeDetailed['securityKeysList']>[number];
type WireKey = NonNullable<Packed<'MeDetailed'>['securityKeysList']>[number];
export function userDateBoundaryTypes(nativeKey: NativeKey, wireKey: WireKey) {
	expectTypeOf(nativeKey.lastUsed).toEqualTypeOf<Date>();
	expectTypeOf(wireKey.lastUsed).toEqualTypeOf<string>();
}

// Independently reconstruct actual public constructors and compare both directions.
export function exactPublicUserSchemaTypes() {
	const other = v.strictObject({ ...packedUserLiteSchema.entries, ...packedUserDetailedNotMeOnlySchema.entries });
	const self = v.strictObject({ ...packedUserLiteSchema.entries, ...packedUserDetailedNotMeOnlySchema.entries, ...packedMeDetailedOnlySchema.entries });
	const detailed = v.union([other, self]);
	const user = v.union([packedUserLiteSchema, detailed]);
	expectTypeOf<v.InferInput<typeof other>>().toEqualTypeOf<v.InferInput<typeof packedUserDetailedNotMeSchema>>();
	expectTypeOf<v.InferOutput<typeof other>>().toEqualTypeOf<v.InferOutput<typeof packedUserDetailedNotMeSchema>>();
	expectTypeOf<v.InferInput<typeof self>>().toEqualTypeOf<v.InferInput<typeof packedMeDetailedSchema>>();
	expectTypeOf<v.InferOutput<typeof self>>().toEqualTypeOf<v.InferOutput<typeof packedMeDetailedSchema>>();
	expectTypeOf<v.InferInput<typeof detailed>>().toEqualTypeOf<v.InferInput<typeof packedUserDetailedSchema>>();
	expectTypeOf<v.InferOutput<typeof detailed>>().toEqualTypeOf<v.InferOutput<typeof packedUserDetailedSchema>>();
	expectTypeOf<v.InferInput<typeof user>>().toEqualTypeOf<v.InferInput<typeof packedUserSchema>>();
	expectTypeOf<v.InferOutput<typeof user>>().toEqualTypeOf<v.InferOutput<typeof packedUserSchema>>();
}
