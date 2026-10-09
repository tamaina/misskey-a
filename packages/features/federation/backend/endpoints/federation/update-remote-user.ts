/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { federationUpdateRemoteUserContract } from './update-remote-user.contract.js';
import type { ApPersonService } from '../../services/ApPersonService.js';
import type { GetterService } from '../../../../api/backend/transport/GetterService.js';
export interface FederationUpdateRemoteUserDependencies {
	getterService: Pick<GetterService, 'getRemoteUser'>;
	apPersonService: Pick<ApPersonService, 'updatePerson'>;
}
export function createFederationUpdateRemoteUserProcedure<Actor extends ApiActor>(deps: FederationUpdateRemoteUserDependencies) {
	return createApiProcedure<Actor>()(federationUpdateRemoteUserContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				const user = await deps.getterService.getRemoteUser(ps.userId);
				await deps.apPersonService.updatePerson(user.uri!);
			})();
			return result;
		});
}
