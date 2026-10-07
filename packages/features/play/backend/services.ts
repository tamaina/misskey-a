/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { FlashEntityService } from './serializers/FlashEntityService.js';
import { FlashLikeEntityService } from './serializers/FlashLikeEntityService.js';
import { FlashService } from './services/FlashService.js';

const flashEntityService = service(FlashEntityService, [ports.flashsRepository, ports.flashLikesRepository, ports.userEntityService, ports.idService]);
export const playServices = defineServices({
	FlashEntityService: flashEntityService,
	FlashLikeEntityService: service(FlashLikeEntityService, [ports.flashLikesRepository, flashEntityService]),
	FlashService: service(FlashService, [ports.flashsRepository, ports.flashLikesRepository, ports.queryService]),
});
