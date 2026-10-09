/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import type * as v from 'valibot';
import type { Endpoints } from '../built/api.types.js';
import type { Following, MetaLite, MetaDetailed } from '../built/entities.js';
import type { packedMetaLiteSchema, packedMetaDetailedSchema } from '../built/contracts/instance/backend/endpoints/meta.schema.js';
import type { ContractEndpoints } from '../built/contract.types.js';
import type { RelationshipsOutputs } from '../built/contracts/relationships/backend/endpoints/relationships.contract.js';
import type { PackedJsonValue as JsonValue } from '../built/contracts/users/backend/json-value.schema.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type FollowingRoutes = 'users/following' | 'users/followers' | 'following/list';
export type FollowingArrays = Assert<Equal<{ [K in FollowingRoutes]: Equal<RelationshipsOutputs[K], Following[]> }[FollowingRoutes], true>>;
export type PublishedFollowingArrays = Assert<Equal<{ [K in FollowingRoutes]: Equal<Endpoints[K]['res'], Following[]> }[FollowingRoutes], true>>;
export type LiteAlias = Assert<Equal<MetaLite, v.InferOutput<typeof packedMetaLiteSchema>>>;
export type DetailedAlias = Assert<Equal<MetaDetailed, v.InferOutput<typeof packedMetaDetailedSchema>>>;
export type MetaResponse = Assert<Equal<ContractEndpoints['meta']['res'], MetaLite | MetaDetailed>>;
export type MetaRootIsFinite = Assert<string extends keyof MetaDetailed ? false : true>;
export type FeaturesAreFinite = Assert<string extends keyof NonNullable<MetaDetailed['features']> ? false : true>;
export type AdsAreFinite = Assert<string extends keyof MetaLite['ads'][number] ? false : true>;
export type SentryRootIsFinite = Assert<string extends keyof NonNullable<MetaLite['sentryForFrontend']> ? false : true>;
export type ExtensionIsJson = Assert<Equal<NonNullable<MetaLite['sentryForFrontend']>['options'][string], JsonValue>>;
export type ExtensionIsNotAny = Assert<Equal<IsAny<MetaLite['clientOptions'][string]>, false>>;
