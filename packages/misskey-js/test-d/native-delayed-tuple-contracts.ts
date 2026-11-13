import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type * as v from 'valibot';
import type { adminQueueDeliverDelayedContract } from '../built/contracts/operations/backend/endpoints/admin/queue/deliver-delayed.contract.js';
import type { adminQueueInboxDelayedContract } from '../built/contracts/operations/backend/endpoints/admin/queue/inbox-delayed.contract.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type A1 = Assert<Equal<Endpoints['admin/queue/deliver-delayed']['res'], [string, number][]>>;
type A2 = Assert<Equal<Endpoints['admin/queue/inbox-delayed']['res'], [string, number][]>>;
type A3 = Assert<Equal<ContractEndpoints['admin/queue/deliver-delayed']['res'], v.InferOutput<NonNullable<typeof adminQueueDeliverDelayedContract['~orpc']['outputSchema']>>>>;
type A4 = Assert<Equal<ContractEndpoints['admin/queue/inbox-delayed']['res'], v.InferOutput<NonNullable<typeof adminQueueInboxDelayedContract['~orpc']['outputSchema']>>>>;
type A5 = Assert<Equal<keyof Endpoints['admin/queue/deliver-delayed']['req'], never>>;
type A6 = Assert<Equal<IsAny<Endpoints['admin/queue/inbox-delayed']['res'][number]>, false>>;
type A7 = Assert<Equal<Endpoints['admin/queue/inbox-delayed']['res'][number][0], string>>;
type A8 = Assert<Equal<Endpoints['admin/queue/inbox-delayed']['res'][number][1], number>>;
const emptyRequest: Endpoints['admin/queue/deliver-delayed']['req'] = {};
const unknownFields: Endpoints['admin/queue/inbox-delayed']['req'] = { future: { retained: true } };
const valid: Endpoints['admin/queue/deliver-delayed']['res'] = [['example.com', 12]];
// @ts-expect-error Native SDK tuple positions are ordered.
const swapped: Endpoints['admin/queue/deliver-delayed']['res'] = [[12, 'example.com']];
// @ts-expect-error Native SDK tuple cardinality requires both elements.
const short: Endpoints['admin/queue/inbox-delayed']['res'] = [['example.com']];
// @ts-expect-error Native SDK tuple cardinality excludes a third element.
const extra: Endpoints['admin/queue/inbox-delayed']['res'] = [['example.com', 12, 'extra']];

// @ts-expect-error Empty native requests still require a JSON object.
const scalarRequest: v.InferInput<NonNullable<typeof adminQueueDeliverDelayedContract['~orpc']['inputSchema']>> = 3;
