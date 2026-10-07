/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { HashtagEntityService } from './serializers/HashtagEntityService.js';
import type { Outputs } from '../../index/backend/service-definitions.js';

export const discoveryServices = defineServices({
	HashtagEntityService: service(HashtagEntityService, []),
});
export const createDiscoveryServices = discoveryServices.create;
export type DiscoveryServices = Outputs<typeof discoveryServices>;
