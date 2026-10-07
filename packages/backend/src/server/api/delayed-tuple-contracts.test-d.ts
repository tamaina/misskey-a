/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { EndpointImplementation as DeliverDelayedEndpoint } from '@features/operations/backend/endpoints/admin/queue/deliver-delayed.js';
import type { EndpointImplementation as InboxDelayedEndpoint } from '@features/operations/backend/endpoints/admin/queue/inbox-delayed.js';
import type { DelayedTupleEndpoints, delayedTupleAdminQueueDeliverDelayedInput } from '@features/operations/contract/delayed-tuple-endpoint-definitions.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type DeliverResponse = DelayedTupleEndpoints['admin/queue/deliver-delayed']['res'];
type InboxResponse = DelayedTupleEndpoints['admin/queue/inbox-delayed']['res'];
type A1 = Assert<Equal<DeliverResponse, [string, number][]>>;
type A2 = Assert<Equal<InboxResponse, [string, number][]>>;
type A3 = Assert<Equal<Awaited<ReturnType<DeliverDelayedEndpoint['exec']>>, DeliverResponse>>;
type A4 = Assert<Equal<Awaited<ReturnType<InboxDelayedEndpoint['exec']>>, InboxResponse>>;
type A5 = Assert<Equal<IsAny<DeliverResponse[number]>, false>>;
type A6 = Assert<Equal<DeliverResponse[number]['length'], 2>>;
type A7 = Assert<Equal<v.InferInput<typeof delayedTupleAdminQueueDeliverDelayedInput>['future'], unknown>>;
type A8 = Assert<Equal<v.InferOutput<typeof delayedTupleAdminQueueDeliverDelayedInput>['future'], unknown>>;
const valid: DeliverResponse = [['example.com', 12]];
// @ts-expect-error The first position must be a string.
const swapped: DeliverResponse = [[12, 'example.com']];
// @ts-expect-error A producer tuple cannot omit the count.
const short: DeliverResponse = [['example.com']];
// @ts-expect-error A producer tuple cannot contain a third array element.
const extra: InboxResponse = [['example.com', 12, 'extra']];
// @ts-expect-error A producer count cannot be null.
const nullCount: InboxResponse = [['example.com', null]];
