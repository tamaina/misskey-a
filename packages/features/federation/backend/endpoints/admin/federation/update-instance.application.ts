/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { InstancesRepository } from '../../../../../persistence/backend/repositories/models.js';
import { UtilityService } from '../../../services/UtilityService.js';
import { DI } from '@/di-symbols.js';
import { FederatedInstanceService } from '../../../services/FederatedInstanceService.js';
import { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminFederationUpdateInstanceInput, AdminFederationUpdateInstanceOutput } from './update-instance.contract.js';
import { adminFederationUpdateInstanceContract } from './update-instance.contract.js';

@Injectable()
export class AdminFederationUpdateInstanceApplicationService {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private federatedInstanceService: FederatedInstanceService,
		private moderationLogService: ModerationLogService,
	) {}

	public async execute(ps: AdminFederationUpdateInstanceInput, me: MiUser): Promise<AdminFederationUpdateInstanceOutput> {
		const result = await (async () => {
			const instance = await this.instancesRepository.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			if (instance == null) {
				throw new Error('instance not found');
			}

			const isSuspendedBefore = instance.suspensionState !== 'none';
			let suspensionState: undefined | 'manuallySuspended' | 'none';

			if (ps.isSuspended != null && isSuspendedBefore !== ps.isSuspended) {
				suspensionState = ps.isSuspended ? 'manuallySuspended' : 'none';
			}

			await this.federatedInstanceService.update(instance.id, {
				suspensionState,
				moderationNote: ps.moderationNote,
			});

			if (ps.isSuspended != null && isSuspendedBefore !== ps.isSuspended) {
				if (ps.isSuspended) {
					this.moderationLogService.log(me, 'suspendRemoteInstance', {
						id: instance.id,
						host: instance.host,
					});
				} else {
					this.moderationLogService.log(me, 'unsuspendRemoteInstance', {
						id: instance.id,
						host: instance.host,
					});
				}
			}

			if (ps.moderationNote != null && instance.moderationNote !== ps.moderationNote) {
				this.moderationLogService.log(me, 'updateRemoteInstanceNote', {
					id: instance.id,
					host: instance.host,
					before: instance.moderationNote,
					after: ps.moderationNote,
				});
			}
		})();
		return v.parse(adminFederationUpdateInstanceContract['~orpc'].outputSchema!, result);
	}
}
