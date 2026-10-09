/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminFederationRefreshRemoteInstanceMetadataContract } from './refresh-remote-instance-metadata.contract.js';
import type { InstancesRepository } from '../../../../../persistence/backend/repositories/models.js';
import type { FetchInstanceMetadataService } from '../../../services/FetchInstanceMetadataService.js';
import type { UtilityService } from '../../../services/UtilityService.js';
import * as v from 'valibot';
export interface AdminFederationRefreshRemoteInstanceMetadataDependencies {
	instancesRepository: Pick<InstancesRepository, 'findOneBy'>;
	utilityService: Pick<UtilityService, 'toPuny'>;
	fetchInstanceMetadataService: Pick<FetchInstanceMetadataService, 'fetchInstanceMetadata'>;
}
export function createAdminFederationRefreshRemoteInstanceMetadataProcedure<Actor extends ApiActor>(deps: AdminFederationRefreshRemoteInstanceMetadataDependencies) {
	return implement(adminFederationRefreshRemoteInstanceMetadataContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminFederationRefreshRemoteInstanceMetadataContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:federation' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				const instance = await deps.instancesRepository.findOneBy({ host: deps.utilityService.toPuny(ps.host) });
				if (instance == null) {
					throw new Error('instance not found');
				}
				deps.fetchInstanceMetadataService.fetchInstanceMetadata(instance, true);
			})();
			return v.parse(adminFederationRefreshRemoteInstanceMetadataContract['~orpc'].outputSchema!, result);
		});
}
