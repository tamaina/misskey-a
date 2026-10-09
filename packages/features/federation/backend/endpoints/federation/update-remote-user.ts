/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { federationUpdateRemoteUserContract } from './update-remote-user.contract.js';
import ms from 'ms';
import type { ApPersonService } from '../../services/ApPersonService.js';
import type { GetterService } from '../../../../api/backend/transport/GetterService.js';
import * as v from 'valibot';
export interface FederationUpdateRemoteUserDependencies {
	getterService: Pick<GetterService, 'getRemoteUser'>;
	apPersonService: Pick<ApPersonService, 'updatePerson'>;
}
export function createFederationUpdateRemoteUserProcedure<Actor extends ApiActor>(deps: FederationUpdateRemoteUserDependencies) {
	return implement(federationUpdateRemoteUserContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({
			name: federationUpdateRemoteUserContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account', limit: {
				duration: ms('1hour'),
				max: 30,
			}
		}))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				const user = await deps.getterService.getRemoteUser(ps.userId);
				await deps.apPersonService.updatePerson(user.uri!);
			})();
			return v.parse(federationUpdateRemoteUserContract['~orpc'].outputSchema!, result);
		});
}
