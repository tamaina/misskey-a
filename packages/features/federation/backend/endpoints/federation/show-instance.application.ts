/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { InstancesRepository } from '../../../../persistence/backend/repositories/models.js';
import { InstanceEntityService } from '../../../../instance/backend/serializers/InstanceEntityService.js';
import { UtilityService } from '../../services/UtilityService.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { FederationShowInstanceInput, FederationShowInstanceOutput } from './show-instance.contract.js';
import { federationShowInstanceContract } from './show-instance.contract.js';

@Injectable()
export class FederationShowInstanceApplicationService {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private instanceEntityService: InstanceEntityService,
	) {}

	public async execute(ps: FederationShowInstanceInput, me: MiUser | null): Promise<FederationShowInstanceOutput> {
		const result = await (async () => {
			const instance = await this.instancesRepository
				.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			return instance ? await this.instanceEntityService.pack(instance, me) : null;
		})();
		return v.parse(federationShowInstanceContract['~orpc'].outputSchema!, result);
	}
}
