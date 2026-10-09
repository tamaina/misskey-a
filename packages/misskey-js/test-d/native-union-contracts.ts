import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { MetaRequest, MetaResponse, UsersRelationRequest, UsersRelationResponse } from '../src/autogen/entities.js';
import type * as v from 'valibot';
import type { metaContract } from '../built/contracts/instance/backend/endpoints/meta.contract.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { UsersRelationContract } from '../built/contracts/relationships/backend/endpoints/relationships.contract.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;

type A1 = Assert<Equal<Endpoints['meta']['req'], v.InferInput<NonNullable<typeof metaContract['~orpc']['inputSchema']>>>>;
type A2 = Assert<Equal<MetaRequest, Endpoints['meta']['req']>>;
type A3 = Assert<Equal<MetaResponse, v.InferOutput<NonNullable<typeof metaContract['~orpc']['outputSchema']>>>>;
type A4 = Assert<Equal<ContractEndpoints['meta']['res'], MetaResponse>>;
type A5 = Assert<Equal<UsersRelationRequest, InferContractRouterInputs<typeof UsersRelationContract>>>;
type RelationFields = Assert<Equal<{ [K in keyof UsersRelationRequest]: UsersRelationRequest[K] }, { userId: string | string[] }>>;
type A6 = Assert<Equal<Endpoints['users/relation']['req'], UsersRelationRequest>>;
type A7 = Assert<Equal<UsersRelationResponse, InferContractRouterOutputs<typeof UsersRelationContract>>>;
type A8 = Assert<Equal<Endpoints['users/relation']['res'], UsersRelationResponse>>;
type A9 = Assert<Equal<'future' extends keyof MetaRequest ? true : false, false>>;
type A10 = Assert<Equal<'future' extends keyof UsersRelationRequest ? true : false, false>>;
type A11 = Assert<Equal<IsAny<MetaResponse>, false>>;
type A12 = Assert<Equal<IsAny<UsersRelationResponse>, false>>;

const emptyMeta: MetaRequest = {};
const undefinedMeta: MetaRequest = { detail: undefined };
const trueMeta: MetaRequest = { detail: true };
const scalarRelation: UsersRelationRequest = { userId: 'Ab12' };
const arrayRelation: UsersRelationRequest = { userId: ['Ab12', 'Ab12'] };
const emptyRelation: UsersRelationRequest = { userId: [] };
// @ts-expect-error SDK declared meta fields retain a concrete boolean type.
const numericMeta: MetaRequest = { detail: 0 };
// @ts-expect-error SDK relation requests require userId.
const missingRelation: UsersRelationRequest = {};
// @ts-expect-error SDK relation arrays contain strings.
const numericRelation: UsersRelationRequest = { userId: [1] };
// @ts-expect-error SDK request fields expose only the declared selector.
const opaqueRelation: UsersRelationRequest = { userId: 'Ab12', future: true };
