/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { serviceOrder } from './api.definition.js';
import { receiptSnapshot } from './policy.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
const id = v.pipe(v.string(), v.minLength(1), v.maxLength(32));
const time = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
const total = v.pipe(v.string(), v.regex(/^(0|[1-9]\d*)$/), v.maxLength(1024));
const label = v.pipe(v.string(), v.maxLength(200));
export const adminBillingOrder = v.strictObject({ userId: v.nullable(id), order: serviceOrder, snapshot: v.nullable(receiptSnapshot) });
export const salesBucket = v.strictObject({ assetKey: label, currencyCode: v.nullable(label), decimals: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)), count: time, unknownTaxCount: time, grossBaseUnits: total, netBaseUnits: v.nullable(total), taxBaseUnits: v.nullable(total),
																																												taxName: v.exactOptional(v.nullable(label)), taxRate: v.exactOptional(v.nullable(label)), serviceKey: v.exactOptional(label), planName: v.exactOptional(label), tokenSymbol: v.exactOptional(label) });
export const billingSalesSummary = v.strictObject({ from: time, to: time, count: time, unknownTaxCount: time, byCurrency: v.array(salesBucket), byTax: v.array(salesBucket), byPlan: v.array(salesBucket), byAsset: v.array(salesBucket) });
export type SalesBucket = v.InferOutput<typeof salesBucket>;
export type BillingSalesSummary = v.InferOutput<typeof billingSalesSummary>;
const procedure = oc.errors({ ...commonErrors, BILLING_NOT_FOUND: { status: 404, data: apiErrorData }, BILLING_CONFLICT: { status: 409, data: apiErrorData }, BILLING_UNAVAILABLE: { status: 400, data: apiErrorData } });

function admin<const Name extends string>(name: Name, write = false) { return procedure.$meta({ requestName: name, requireCredential: true, requireAdmin: true, kind: write ? 'write:admin:meta' : 'read:admin:meta', ...(write ? { limit: { duration: 60000, max: 10 } } : {}) } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: `/${name}` }); }

export const billingReportsContract = {
	listBillingOrderHistory: procedure.$meta({ requestName: 'billing/orders/history', requireCredential: true, kind: 'read:account' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/orders/history' }).input(v.strictObject({ cursor: v.exactOptional(id), limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20) })).output(v.strictObject({ items: v.array(serviceOrder), nextCursor: v.nullable(id) })),
	listAdminBillingOrders: admin('admin/billing/orders/list').input(v.strictObject({ userId: v.exactOptional(id), cursor: v.exactOptional(id), limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20) })).output(v.strictObject({ items: v.array(adminBillingOrder), nextCursor: v.nullable(id) })),
	checkAdminBillingOrder: admin('admin/billing/orders/check', true).input(v.strictObject({ orderId: id })).output(adminBillingOrder),
	getBillingSalesSummary: admin('admin/billing/sales/summary').input(v.pipe(v.strictObject({ from: time, to: time }), v.check(range => range.from < range.to, 'from must precede to'))).output(billingSalesSummary),
};
