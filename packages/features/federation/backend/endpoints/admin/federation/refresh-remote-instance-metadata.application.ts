/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { InstancesRepository } from '../../../../../persistence/backend/repositories/models.js';
import { FetchInstanceMetadataService } from '../../../services/FetchInstanceMetadataService.js';
import { UtilityService } from '../../../services/UtilityService.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminFederationRefreshRemoteInstanceMetadataInput, adminFederationRefreshRemoteInstanceMetadataOutput } from './refresh-remote-instance-metadata.contract.js';

@Injectable()
export class AdminFederationRefreshRemoteInstanceMetadataApplicationService {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminFederationRefreshRemoteInstanceMetadataInput>, _me: MiUser): Promise<v.InferOutput<typeof adminFederationRefreshRemoteInstanceMetadataOutput>> {
		const result = await (async () => {
			const instance = await this.instancesRepository.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			if (instance == null) {
				throw new Error('instance not found');
			}

			this.fetchInstanceMetadataService.fetchInstanceMetadata(instance, true);
		})();
		return v.parse(adminFederationRefreshRemoteInstanceMetadataOutput, result);
	}
}
