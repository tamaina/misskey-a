/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { policySettings, residencyStatement } from './policy.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
const procedure = oc.errors({ ...commonErrors, BILLING_UNAVAILABLE: { status: 400, data: apiErrorData }, BILLING_CONFLICT: { status: 409, data: apiErrorData } });
export const billingPolicyContract = {
	getBillingPolicy: procedure.$meta({ requestName: 'admin/billing/policy/get', requireCredential: true, requireAdmin: true, kind: 'read:admin:meta' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/billing/policy/get' }).input(v.strictObject({})).output(v.nullable(policySettings)),
	upsertBillingPolicy: procedure.$meta({ requestName: 'admin/billing/policy/upsert', requireCredential: true, requireAdmin: true, kind: 'write:admin:meta', limit: { duration: 60000, max: 10 } } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/admin/billing/policy/upsert' }).input(policySettings).output(policySettings),
	getPurchaseRequirements: procedure.$meta({ requestName: 'billing/purchase-requirements', requireCredential: true, kind: 'read:account' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/billing/purchase-requirements' }).input(v.strictObject({})).output(v.strictObject({ isRequired: v.boolean(), country: v.nullable(v.string()), statement: v.nullable(residencyStatement) })),
};
