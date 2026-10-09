/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { InstanceOperations } from '@features/instance/backend/operations.js';
import type { RelationshipsOperations } from '@features/relationships/backend/endpoints/relationships.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { metaContract, metaInput } from '@features/instance/backend/endpoints/meta.contract.js';
import type { packedMetaLiteSchema, packedMetaDetailedSchema } from '@features/instance/backend/endpoints/meta.schema.js';
import type { InferContractRouterOutputs, InferSchemaOutput } from '@orpc/contract';
import type { UsersRelationContract, unionUsersRelationInput } from '@features/relationships/backend/endpoints/relationships.contract.js';
import type { packedUserRelationSchema, packedRelationFollowingSchema } from '@features/relationships/backend/endpoints/relationships.schema.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type MetaInput = NonNullable<v.InferInput<typeof metaInput>>;
type MetaParsed = v.InferOutput<typeof metaInput>;
type RelationInput = v.InferInput<typeof unionUsersRelationInput>;
type Relation = v.InferOutput<typeof packedUserRelationSchema>;
type MetaResponse = InferContractRouterOutputs<typeof metaContract>;
type RelationResponse = InferContractRouterOutputs<typeof UsersRelationContract>;

type A1 = Assert<Equal<MetaInput['detail'], boolean | undefined>>;
type A2 = Assert<Equal<MetaParsed['detail'], boolean>>;
type A3 = Assert<Equal<keyof MetaInput, 'detail'>>;
type A4 = Assert<Equal<RelationInput['userId'], string | string[]>>;
type A5 = Assert<Equal<keyof RelationInput, 'userId'>>;
type A6 = Assert<Equal<MetaResponse, v.InferOutput<typeof packedMetaLiteSchema> | v.InferOutput<typeof packedMetaDetailedSchema>>>;
type A7 = Assert<Equal<RelationResponse, Relation[]>>;
type A8 = Assert<Equal<Awaited<ReturnType<InstanceOperations<ApiActor>['meta']>>, InferSchemaOutput<NonNullable<typeof metaContract['~orpc']['outputSchema']>>>>;
type A9 = Assert<Equal<Awaited<ReturnType<RelationshipsOperations<ApiActor>['users/relation']>>, RelationResponse>>;
type A10 = Assert<Equal<IsAny<MetaResponse>, false>>;
type A11 = Assert<Equal<IsAny<RelationResponse>, false>>;
type A12 = Assert<Equal<Relation['following'], v.InferOutput<typeof packedRelationFollowingSchema> | null>>;

const emptyMeta: MetaInput = {};
const explicitUndefinedMeta: MetaInput = { detail: undefined };
const scalarRelation: RelationInput = { userId: 'Ab12' };
const repeatedRelations: RelationInput = { userId: ['Ab12', 'Ab12'] };
const emptyRelations: RelationInput = { userId: [] };
// @ts-expect-error Native requests expose only the declared selector.
const opaqueRelations: RelationInput = { userId: 'Ab12', future: { retained: true } };
// @ts-expect-error Meta requests expose only the declared detail flag.
const extraMeta: MetaInput = { detail: true, future: true };
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

export type Cases = [A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12];
void emptyMeta; void explicitUndefinedMeta; void scalarRelation; void repeatedRelations; void emptyRelations; void opaqueRelations; void extraMeta; void missingParsedDefault; void nullMeta; void missingSelector; void invalidIdentifier; void nullIdentifier;
