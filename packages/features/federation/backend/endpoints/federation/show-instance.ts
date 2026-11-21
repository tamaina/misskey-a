/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toFederationInstance } from '../../federation.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { federationShowInstanceContract } from './show-instance.contract.js';
import type { InstancesRepository } from '../../../../persistence/backend/repositories/models.js';
import type { InstanceEntityService } from '../../../../instance/backend/serializers/InstanceEntityService.js';
import type { UtilityService } from '../../services/UtilityService.js';
export interface FederationShowInstanceDependencies {
	instancesRepository: InstancesRepository;
	utilityService: Pick<UtilityService, 'toPuny'>;
	instanceEntityService: Pick<InstanceEntityService, 'pack'>;
}
export function createFederationShowInstanceProcedure<Actor extends ApiActor>(deps: FederationShowInstanceDependencies) {
	return createApiProcedure<Actor>()(federationShowInstanceContract)
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const instance = await deps.instancesRepository
					.findOneBy({ host: deps.utilityService.toPuny(ps.host) });
				return instance ? toFederationInstance(await deps.instanceEntityService.pack(instance, me)) : null;
			})();
			return result;
		});
}
