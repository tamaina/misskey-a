/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { federationShowInstanceContract } from './show-instance.contract.js';
import type { InstancesRepository } from '../../../../persistence/backend/repositories/models.js';
import type { InstanceEntityService } from '../../../../instance/backend/serializers/InstanceEntityService.js';
import type { UtilityService } from '../../services/UtilityService.js';
import * as v from 'valibot';
export interface FederationShowInstanceDependencies {
	instancesRepository: InstancesRepository;
	utilityService: Pick<UtilityService, 'toPuny'>;
	instanceEntityService: Pick<InstanceEntityService, 'pack'>;
}
export function createFederationShowInstanceProcedure<Actor extends ApiActor>(deps: FederationShowInstanceDependencies) {
	return implement(federationShowInstanceContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: federationShowInstanceContract['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const instance = await deps.instancesRepository
					.findOneBy({ host: deps.utilityService.toPuny(ps.host) });
				return instance ? await deps.instanceEntityService.pack(instance, me) : null;
			})();
			return v.parse(federationShowInstanceContract['~orpc'].outputSchema!, result);
		});
}
