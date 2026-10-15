/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { createApiProcedure } from '../../api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../api/backend/transport/middleware.js';
import { residenceContract } from './residence.contract.js';
import type { createResidenceStore } from './residence-store.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
export function createResidenceRouter<Actor extends ApiActor>(store: ReturnType<typeof createResidenceStore>) {
	const procedure = createApiProcedure<Actor>(), account = requirePrincipal<Actor>();
	return implement(residenceContract).$context<ApiContext<Actor>>().router({
		getResidence: procedure(residenceContract.getResidence).use(account).handler(({ context }) => store.get(context.principal.id)),
		setResidence: procedure(residenceContract.setResidence).use(account).handler(({ input, context }) => store.save(context.principal.id, input)),
	});
}
