/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import type * as v from 'valibot';
import type { Endpoints } from '../built/api.types.js';
import type { adminGetIndexStatsContract } from '../built/contracts/operations/backend/endpoints/admin/get-index-stats.contract.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Response = Assert<Equal<Endpoints['admin/get-index-stats']['res'], v.InferOutput<NonNullable<typeof adminGetIndexStatsContract['~orpc']['outputSchema']>>>>;
// Empty JSON requests retain the SDK's object-only boundary.
type Request = Assert<Equal<Endpoints['admin/get-index-stats']['req'], v.InferInput<NonNullable<typeof adminGetIndexStatsContract['~orpc']['inputSchema']>>>>;
type Fields = Assert<Equal<keyof Endpoints['admin/get-index-stats']['res'][number], 'schemaname' | 'tablename' | 'indexname' | 'tablespace' | 'indexdef'>>;
type NullableSources = Assert<Equal<Pick<Endpoints['admin/get-index-stats']['res'][number], 'schemaname' | 'tablespace' | 'indexdef'>, { schemaname: string | null; tablespace: string | null; indexdef: string | null }>>;

export type Cases = [Response, Request, Fields, NullableSources];
