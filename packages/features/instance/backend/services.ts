/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { InstanceEntityService } from './serializers/InstanceEntityService.js';
import { MetaEntityService } from './serializers/MetaEntityService.js';
import type { AdsRepository, MiMeta } from '@/models/_.js';
import type { RoleService } from '../../roles/backend/services/RoleService.js';
import type { UtilityService } from '@/core/UtilityService.js';
import type { Config } from '@/config.js';
import type { SystemAccountService } from '../../users/backend/services/SystemAccountService.js';

export interface InstanceServicesDependencies {
	meta: MiMeta;
	roleService: Pick<RoleService, 'isModerator'>;
	utilityService: Pick<UtilityService, 'isBlockedHost' | 'isDeliverSuspendedSoftware' | 'isMediaSilencedHost' | 'isSilencedHost'>;
	config: Config;
	adsRepository: AdsRepository;
	systemAccountService: Pick<SystemAccountService, 'fetch'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createInstanceServices(deps: InstanceServicesDependencies) {
	const instanceEntityService = new InstanceEntityService(deps.meta, deps.roleService, deps.utilityService);
	const metaEntityService = new MetaEntityService(deps.config, deps.meta, deps.adsRepository, deps.systemAccountService);

	return {
		InstanceEntityService: instanceEntityService,
		MetaEntityService: metaEntityService,
	};
}

export type InstanceServices = ReturnType<typeof createInstanceServices>;
