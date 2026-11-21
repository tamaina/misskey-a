/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import type { ContractRouterClient } from '@orpc/contract';
import type { billingPolicyContract } from '../backend/policy.contract.js';
export type BillingPolicyClient = ContractRouterClient<typeof billingPolicyContract>;
export const nativeBillingPolicyClient: BillingPolicyClient = {
	getBillingPolicy: input => misskeyApi('admin/billing/policy/get', input),
	upsertBillingPolicy: input => misskeyApi('admin/billing/policy/upsert', input),
	getPurchaseRequirements: input => misskeyApi('billing/purchase-requirements', input),
};
