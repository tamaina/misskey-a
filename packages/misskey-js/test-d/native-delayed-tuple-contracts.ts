import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { DelayedTupleEndpoints } from '../built/contracts/operations/contract/delayed-tuple-endpoint-definitions.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type A1 = Assert<Equal<Endpoints['admin/queue/deliver-delayed']['res'], [string, number][]>>;
type A2 = Assert<Equal<Endpoints['admin/queue/inbox-delayed']['res'], [string, number][]>>;
type A3 = Assert<Equal<ContractEndpoints['admin/queue/deliver-delayed']['res'], DelayedTupleEndpoints['admin/queue/deliver-delayed']['res']>>;
type A4 = Assert<Equal<ContractEndpoints['admin/queue/inbox-delayed']['res'], DelayedTupleEndpoints['admin/queue/inbox-delayed']['res']>>;
type A5 = Assert<Equal<Endpoints['admin/queue/deliver-delayed']['req']['future'], unknown>>;
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
