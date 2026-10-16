/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import type { RefundClient } from './refund-client.js';
export const nativeRefundClient: RefundClient = {
	requestRefund: input => misskeyApi('billing/refunds/request', input),
	listRefunds: input => misskeyApi('billing/refunds/list', input),
	showRefund: input => misskeyApi('billing/refunds/show', input),
	cancelRefund: input => misskeyApi('billing/refunds/cancel', input),
	refundDocument: input => misskeyApi('billing/refunds/document', input),
	adminListRefunds: input => misskeyApi('admin/billing/refunds/list', input),
	adminShowRefund: input => misskeyApi('admin/billing/refunds/show', input),
	decideRefund: input => misskeyApi('admin/billing/refunds/decide', input),
	startRefundTransfer: input => misskeyApi('admin/billing/refunds/start', input),
	submitRefundTransfer: input => misskeyApi('admin/billing/refunds/submit', input),
	checkRefund: input => misskeyApi('admin/billing/refunds/check', input),
};
