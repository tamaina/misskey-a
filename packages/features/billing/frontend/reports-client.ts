/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import type { ContractRouterClient } from '@orpc/contract';
import type { billingReportsContract } from '../backend/reports.contract.js';
export type BillingReportsClient = ContractRouterClient<typeof billingReportsContract>;
export const nativeBillingReportsClient: BillingReportsClient = {
	listBillingOrderHistory: input => misskeyApi('billing/orders/history', input),
	listAdminBillingOrders: input => misskeyApi('admin/billing/orders/list', input),
	checkAdminBillingOrder: input => misskeyApi('admin/billing/orders/check', input),
	getBillingSalesSummary: input => misskeyApi('admin/billing/sales/summary', input),
};
