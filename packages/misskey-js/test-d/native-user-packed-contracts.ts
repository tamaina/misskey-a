/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */
import type * as v from 'valibot';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { usersContract } from '../built/contracts/users/backend/api.contract.js';
import type { notesApiContract } from '../built/contracts/notes/backend/api.contract.js';
import type { relationshipsContract } from '../built/contracts/relationships/backend/endpoints/relationships.contract.js';
import type { FeatureEndpoints, PackedModels } from '../built/contracts/index/contract/index.js';
import type { ContractEndpoints } from '../built/contract.types.js';
import type { Endpoints } from '../built/api.types.js';
import type { UserLite, UserDetailedNotMe, MeDetailed, UserDetailed, User, Following } from '../built/autogen/models.js';
import type { packedUserLiteSchema, packedUserDetailedNotMeSchema, packedMeDetailedSchema, packedUserDetailedSchema, packedUserSchema } from '../built/contracts/users/backend/user.schema.js';
import type { packedFollowingSchema } from '../built/contracts/relationships/backend/endpoints/relationships.schema.js';
import type { packedEndpointDefinitions as definitions0 } from '../built/contracts/users/contract/packed-endpoint-definitions.js';
import type { inlineEndpointDefinitions as definitions1 } from '../built/contracts/users/contract/endpoint-definitions.js';
import type { usersShowDefinition as definitions2 } from '../built/contracts/users/contract/show-endpoint-definition.js';
import type { iUpdateDefinition as definitions3 } from '../built/contracts/users/contract/user-update-endpoint-definitions.js';
import type { outputCompositionEndpointDefinitions as definitions4 } from '../built/contracts/auth/contract/output-composition-endpoint-definitions.js';
import type { packedEndpointDefinitions as definitions5 } from '../built/contracts/auth/contract/packed-endpoint-definitions.js';
import type { packedEndpointDefinitions as definitions6 } from '../built/contracts/notes/contract/packed-endpoint-definitions.js';
import type { packedEndpointDefinitions as definitions7 } from '../built/contracts/relationships/contract/packed-endpoint-definitions.js';
import type { selectorCommonEndpointDefinitions as definitions8 } from '../built/contracts/relationships/contract/selector-common-endpoint-definitions.js';
import type { outputCompositionEndpointDefinitions as definitions9 } from '../built/contracts/federation/contract/output-composition-endpoint-definitions.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
export type UserLiteExact = Assert<Equal<UserLite, v.InferOutput<typeof packedUserLiteSchema>>>;
export type UserLiteRegistry = Assert<Equal<PackedModels['UserLite'], UserLite>>;
export type UserLiteNoAny = Assert<Equal<IsAny<UserLite>, false>>;
export type UserDetailedNotMeExact = Assert<Equal<UserDetailedNotMe, v.InferOutput<typeof packedUserDetailedNotMeSchema>>>;
export type UserDetailedNotMeRegistry = Assert<Equal<PackedModels['UserDetailedNotMe'], UserDetailedNotMe>>;
export type UserDetailedNotMeNoAny = Assert<Equal<IsAny<UserDetailedNotMe>, false>>;
export type MeDetailedExact = Assert<Equal<MeDetailed, v.InferOutput<typeof packedMeDetailedSchema>>>;
export type MeDetailedRegistry = Assert<Equal<PackedModels['MeDetailed'], MeDetailed>>;
export type MeDetailedNoAny = Assert<Equal<IsAny<MeDetailed>, false>>;
export type UserDetailedExact = Assert<Equal<UserDetailed, v.InferOutput<typeof packedUserDetailedSchema>>>;
export type UserDetailedRegistry = Assert<Equal<PackedModels['UserDetailed'], UserDetailed>>;
export type UserDetailedNoAny = Assert<Equal<IsAny<UserDetailed>, false>>;
export type UserExact = Assert<Equal<User, v.InferOutput<typeof packedUserSchema>>>;
export type UserRegistry = Assert<Equal<PackedModels['User'], User>>;
export type UserNoAny = Assert<Equal<IsAny<User>, false>>;
export type FollowingExact = Assert<Equal<Following, v.InferOutput<typeof packedFollowingSchema>>>;
export type FollowingRegistry = Assert<Equal<PackedModels['Following'], Following>>;
export type FollowingNoAny = Assert<Equal<IsAny<Following>, false>>;

type Definitions = typeof definitions0 & typeof definitions1 & { 'users/show': typeof definitions2 } & { 'i/update': typeof definitions3 } & typeof definitions4 & typeof definitions5 & typeof definitions6 & typeof definitions7 & typeof definitions8 & typeof definitions9;
type Covered = Extract<keyof Definitions, 'i' | 'i/update' | 'i/move' | 'i/update-email' | 'i/pin' | 'i/unpin' | 'users' | 'users/show' | 'admin/accounts/find-by-email' | 'admin/accounts/create' | 'ap/show' | 'following/list' | 'users/followers' | 'users/following'>;
export type Coverage = Assert<Equal<Covered, 'i' | 'i/update' | 'i/move' | 'i/update-email' | 'i/pin' | 'i/unpin' | 'users' | 'users/show' | 'admin/accounts/find-by-email' | 'admin/accounts/create' | 'ap/show' | 'following/list' | 'users/followers' | 'users/following'>>;
type NativeContracts = {
	'i': typeof usersContract['i'];
	'i/update': typeof usersContract['i/update'];
	'i/move': typeof usersContract['i/move'];
	'users': typeof usersContract['users'];
	'users/show': typeof usersContract['users/show'];
	'admin/accounts/find-by-email': typeof usersContract['admin/accounts/find-by-email'];
	'i/pin': typeof notesApiContract['iPin'];
	'i/unpin': typeof notesApiContract['iUnpin'];
	'following/list': typeof relationshipsContract['following/list'];
	'users/followers': typeof relationshipsContract['users/followers'];
	'users/following': typeof relationshipsContract['users/following'];
};
type NativeRequest<K extends Covered> = K extends keyof NativeContracts
	? InferContractRouterInputs<NativeContracts[K]> : v.InferInput<Definitions[K]['input']>;
type NativeResponse<K extends Covered> = K extends keyof NativeContracts
	? InferContractRouterOutputs<NativeContracts[K]> extends void ? null : InferContractRouterOutputs<NativeContracts[K]>
	: v.InferOutput<Definitions[K]['output']>;
export type NativeRequestParity = Assert<Equal<{ [K in Covered]: Equal<K extends keyof NativeContracts ? ContractEndpoints[K]['req'] : FeatureEndpoints[K]['req'], NativeRequest<K>> }[Covered], true>>;
export type NativeResponseParity = Assert<Equal<{ [K in Covered]: Equal<K extends keyof NativeContracts ? ContractEndpoints[K]['res'] : FeatureEndpoints[K]['res'], NativeResponse<K>> }[Covered], true>>;
export type PublishedResponseParity = Assert<Equal<{ [K in Covered]: Equal<ContractEndpoints[K]['res'], NativeResponse<K>> }[Covered], true>>;
// users/show intentionally retains its documented SDK conditional-response adapter.
export type FinalSdkResponseParity = Assert<Equal<{ [K in Exclude<Covered, 'users/show'>]: Equal<Endpoints[K]['res'], ContractEndpoints[K]['res']> }[Exclude<Covered, 'users/show'>], true>>;
export type FinalSdkRequestParity = Assert<Equal<{ [K in Covered]: Equal<Endpoints[K]['req'], ContractEndpoints[K]['req']> }[Covered], true>>;
export type KeyLastUsedIsWireString = Assert<Equal<NonNullable<MeDetailed['securityKeysList']>[number]['lastUsed'], string>>;
export type NoUndefinedOrUnknownSelf = Assert<Equal<IsAny<MeDetailed['unreadAnnouncements'][number]>, false>>;
