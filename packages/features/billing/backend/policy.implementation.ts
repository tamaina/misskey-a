/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { createApiProcedure } from '../../api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../api/backend/transport/middleware.js';
import { billingPolicyContract } from './policy.contract.js';
import type { createBillingPolicyStore } from './policy-store.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
export function createBillingPolicyRouter<Actor extends ApiActor>(store: ReturnType<typeof createBillingPolicyStore>) {
	const procedure = createApiProcedure<Actor>(), account = requirePrincipal<Actor>();
	return implement(billingPolicyContract).$context<ApiContext<Actor>>().router({
		getBillingPolicy: procedure(billingPolicyContract.getBillingPolicy).handler(() => store.get()),
		upsertBillingPolicy: procedure(billingPolicyContract.upsertBillingPolicy).use(account).handler(({ input, context }) => store.upsert(input, context.principal.id)),
		getPurchaseRequirements: procedure(billingPolicyContract.getPurchaseRequirements).handler(({ context }) => store.requirements(context)),
	});
}
