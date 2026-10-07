/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { ReversiGameEntityService } from './serializers/ReversiGameEntityService.js';

export const gameServices = defineServices({
	ReversiGameEntityService: service(ReversiGameEntityService, [ports.reversiGamesRepository, ports.userEntityService, ports.idService]),
});
