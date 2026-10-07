/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { InstanceEntityService } from './serializers/InstanceEntityService.js';
import { MetaEntityService } from './serializers/MetaEntityService.js';

export const instanceServices = defineServices({
	InstanceEntityService: service(InstanceEntityService, [ports.meta, ports.roleService, ports.utilityService]),
	MetaEntityService: service(MetaEntityService, [ports.config, ports.meta, ports.adsRepository, ports.systemAccountService]),
});
