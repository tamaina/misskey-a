/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import { expectAssignable, expectNotAssignable } from 'tsd';
import type * as v from 'valibot';
import type { packedEndpointDefinitions } from '../built/contracts/roles/contract/packed-endpoint-definitions.js';
import type { referenceEndpointDefinitions } from '../built/contracts/roles/contract/reference-endpoint-definitions.js';
import type { Endpoints } from '../built/api.types.js';
import type { entities } from '../built/index.js';
import type { FeatureEndpoints } from '../built/contracts/index/contract/index.js';
import type { AdminRolesCreateRequest } from '../built/autogen/entities.js';
import type { PartialRolePolicyOverride } from '../built/entities.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type Request0 = Assert<Equal<FeatureEndpoints['admin/roles/create']['req'], v.InferInput<(typeof packedEndpointDefinitions)['admin/roles/create']['input']>>>;
type Response0 = Assert<Equal<Endpoints['admin/roles/create']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['admin/roles/create']['output']>>>;
type Request1 = Assert<Equal<FeatureEndpoints['admin/roles/list']['req'], v.InferInput<(typeof packedEndpointDefinitions)['admin/roles/list']['input']>>>;
type Response1 = Assert<Equal<Endpoints['admin/roles/list']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['admin/roles/list']['output']>>>;
type Request2 = Assert<Equal<Endpoints['admin/roles/show']['req'], v.InferInput<(typeof packedEndpointDefinitions)['admin/roles/show']['input']>>>;
type Response2 = Assert<Equal<Endpoints['admin/roles/show']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['admin/roles/show']['output']>>>;
type Request3 = Assert<Equal<FeatureEndpoints['roles/list']['req'], v.InferInput<(typeof packedEndpointDefinitions)['roles/list']['input']>>>;
type Response3 = Assert<Equal<Endpoints['roles/list']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['roles/list']['output']>>>;
type Request4 = Assert<Equal<Endpoints['roles/notes']['req'], v.InferInput<(typeof packedEndpointDefinitions)['roles/notes']['input']>>>;
type Response4 = Assert<Equal<Endpoints['roles/notes']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['roles/notes']['output']>>>;
type Request5 = Assert<Equal<Endpoints['roles/show']['req'], v.InferInput<(typeof packedEndpointDefinitions)['roles/show']['input']>>>;
type Response5 = Assert<Equal<Endpoints['roles/show']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['roles/show']['output']>>>;
type Request6 = Assert<Equal<Endpoints['roles/users']['req'], v.InferInput<(typeof packedEndpointDefinitions)['roles/users']['input']>>>;
type Response6 = Assert<Equal<Endpoints['roles/users']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['roles/users']['output']>>>;
type Request7 = Assert<Equal<FeatureEndpoints['admin/roles/users']['req'], v.InferInput<(typeof referenceEndpointDefinitions)['admin/roles/users']['input']>>>;
type Response7 = Assert<Equal<Endpoints['admin/roles/users']['res'], v.InferOutput<(typeof referenceEndpointDefinitions)['admin/roles/users']['output']>>>;

type CoveredRoutes = 'admin/roles/create' | 'admin/roles/list' | 'admin/roles/show' | 'roles/list' | 'roles/notes' | 'roles/show' | 'roles/users' | 'admin/roles/users';
type Coverage = Assert<Equal<CoveredRoutes, keyof typeof packedEndpointDefinitions | keyof typeof referenceEndpointDefinitions>>;

// Public SDK request compatibility remains explicit: empty bodies are object-only,
// transport extension indexes are omitted, and admin/create keeps its reviewed policy override.
type EmptyAdmin = Assert<Equal<keyof Endpoints['admin/roles/list']['req'], never>>;
type EmptyAdminPrimitive = Assert<Equal<1 extends Endpoints['admin/roles/list']['req'] ? true : false, false>>;
type EmptyPublic = Assert<Equal<keyof Endpoints['roles/list']['req'], never>>;
type EmptyPublicPrimitive = Assert<Equal<1 extends Endpoints['roles/list']['req'] ? true : false, false>>;
type LegacyCreate = Assert<Equal<Endpoints['admin/roles/create']['req'], Omit<AdminRolesCreateRequest, 'policies'> & { policies: PartialRolePolicyOverride }>>;
type DeclaredAdminUsers = Assert<Equal<Endpoints['admin/roles/users']['req'], { roleId: string; sinceId?: string; untilId?: string; sinceDate?: number; untilDate?: number; limit?: number }>>;

export type Cases = [Coverage, EmptyAdmin, EmptyAdminPrimitive, EmptyPublic, EmptyPublicPrimitive, LegacyCreate, DeclaredAdminUsers, Request0, Response0, Request1, Response1, Request2, Response2, Request3, Response3, Request4, Response4, Request5, Response5, Request6, Response6, Request7, Response7];

expectAssignable<entities.Role['policies'][string]>({ value: 'available', priority: 0, useDefault: true, future: { nested: [null, true] } });
expectAssignable<entities.Role['policies'][string]>({ value: ['image/*'] });
expectNotAssignable<entities.Role['policies'][string]>({ future: new Date() });
expectNotAssignable<entities.Role['policies'][string]>({ future: undefined });
expectNotAssignable<entities.RoleLite>({ id: 'role', name: 'role', color: null, iconUrl: null, description: '', isModerator: false, isAdministrator: false, displayOrder: 0, future: true });
