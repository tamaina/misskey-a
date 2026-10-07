/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { ReversiGameEntityService } from './serializers/ReversiGameEntityService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const gameServices = defineServices({
	ReversiGameEntityService: service(ReversiGameEntityService, [ports.reversiGamesRepository, ports.userEntityService, ports.idService]),
});
export const createGameServices = gameServices.create;
export type GameServicesDependencies = Inputs<typeof gameServices>;
export type GameServices = Outputs<typeof gameServices>;
