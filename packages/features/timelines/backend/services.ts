/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { AntennaEntityService } from './serializers/AntennaEntityService.js';

export const timelineServices = defineServices({
	AntennaEntityService: service(AntennaEntityService, [ports.antennasRepository, ports.idService]),
});
