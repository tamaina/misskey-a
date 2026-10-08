/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { Packed } from '@features/index/contract/packed.js';
import type { NativeMetaLite, NativeMetaDetailed } from '@features/instance/backend/serializers/native-meta.js';
import type { EndpointImplementation as MetaEndpoint } from '@features/instance/backend/endpoints/meta.js';
import type { EndpointImplementation as RelationEndpoint } from '@features/relationships/backend/endpoints/users/relation.js';
import type { unionMetaInput, UnionEndpoints as InstanceUnionEndpoints } from '@features/instance/contract/union-endpoint-definitions.js';
import type { unionUsersRelationInput, unionUsersRelationModel, UnionEndpoints as RelationshipUnionEndpoints } from '@features/relationships/contract/union-endpoint-definitions.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type MetaInput = v.InferInput<typeof unionMetaInput>;
type MetaParsed = v.InferOutput<typeof unionMetaInput>;
type RelationInput = v.InferInput<typeof unionUsersRelationInput>;
type Relation = v.InferOutput<typeof unionUsersRelationModel>;
type MetaResponse = InstanceUnionEndpoints['meta']['res'];
type RelationResponse = RelationshipUnionEndpoints['users/relation']['res'];

type A1 = Assert<Equal<MetaInput['detail'], boolean | undefined>>;
type A2 = Assert<Equal<MetaParsed['detail'], boolean>>;
type A3 = Assert<Equal<MetaInput['future'], unknown>>;
type A4 = Assert<Equal<RelationInput['userId'], string | string[]>>;
type A5 = Assert<Equal<RelationInput['future'], unknown>>;
type A6 = Assert<Equal<MetaResponse, Packed<'MetaLite'> | Packed<'MetaDetailed'>>>;
type A7 = Assert<Equal<RelationResponse, Relation | Relation[]>>;
type A8 = Assert<Equal<Awaited<ReturnType<MetaEndpoint['exec']>>, NativeMetaLite | NativeMetaDetailed>>;
type A9 = Assert<Equal<Awaited<ReturnType<RelationEndpoint['exec']>>, RelationResponse>>;
type A10 = Assert<Equal<IsAny<MetaResponse>, false>>;
type A11 = Assert<Equal<IsAny<RelationResponse>, false>>;
type A12 = Assert<Equal<'following' extends keyof Relation ? true : false, false>>;

const emptyMeta: MetaInput = {};
const explicitUndefinedMeta: MetaInput = { detail: undefined };
const scalarRelation: RelationInput = { userId: 'Ab12' };
const repeatedRelations: RelationInput = { userId: ['Ab12', 'Ab12'] };
const emptyRelations: RelationInput = { userId: [] };
const opaqueRelations: RelationInput = { userId: 'Ab12', future: { retained: true } };
// @ts-expect-error The native parsed default is a required boolean.
const missingParsedDefault: MetaParsed = {};
// @ts-expect-error Null is not a valid meta detail value.
const nullMeta: MetaInput = { detail: null };
// @ts-expect-error The relation selector is required.
const missingSelector: RelationInput = {};
// @ts-expect-error Identifier arrays cannot contain numbers.
const invalidIdentifier: RelationInput = { userId: ['Ab12', 1] };
// @ts-expect-error Scalar relations cannot be null.
const nullIdentifier: RelationInput = { userId: null };
