/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminFederationUpdateInstanceContract } from './update-instance.contract.js';
import type { InstancesRepository } from '../../../../../persistence/backend/repositories/models.js';
import type { UtilityService } from '../../../services/UtilityService.js';
import type { FederatedInstanceService } from '../../../services/FederatedInstanceService.js';
import type { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
import * as v from 'valibot';
export interface AdminFederationUpdateInstanceDependencies {
	instancesRepository: Pick<InstancesRepository, 'findOneBy'>;
	utilityService: Pick<UtilityService, 'toPuny'>;
	federatedInstanceService: Pick<FederatedInstanceService, 'update'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminFederationUpdateInstanceProcedure<Actor extends ApiActor>(deps: AdminFederationUpdateInstanceDependencies) {
	return implement(adminFederationUpdateInstanceContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminFederationUpdateInstanceContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:federation' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const instance = await deps.instancesRepository.findOneBy({ host: deps.utilityService.toPuny(ps.host) });
				if (instance == null) {
					throw new Error('instance not found');
				}
				const isSuspendedBefore = instance.suspensionState !== 'none';
				let suspensionState: undefined | 'manuallySuspended' | 'none';
				if (ps.isSuspended != null && isSuspendedBefore !== ps.isSuspended) {
					suspensionState = ps.isSuspended ? 'manuallySuspended' : 'none';
				}
				await deps.federatedInstanceService.update(instance.id, {
					suspensionState,
					moderationNote: ps.moderationNote,
				});
				if (ps.isSuspended != null && isSuspendedBefore !== ps.isSuspended) {
					if (ps.isSuspended) {
						deps.moderationLogService.log(me, 'suspendRemoteInstance', {
							id: instance.id,
							host: instance.host,
						});
					} else {
						deps.moderationLogService.log(me, 'unsuspendRemoteInstance', {
							id: instance.id,
							host: instance.host,
						});
					}
				}
				if (ps.moderationNote != null && instance.moderationNote !== ps.moderationNote) {
					deps.moderationLogService.log(me, 'updateRemoteInstanceNote', {
						id: instance.id,
						host: instance.host,
						before: instance.moderationNote,
						after: ps.moderationNote,
					});
				}
			})();
			return v.parse(adminFederationUpdateInstanceContract['~orpc'].outputSchema!, result);
		});
}
