/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AntennaEntityService } from './serializers/AntennaEntityService.js';
import type { AntennasRepository } from '@/models/_.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface TimelineServicesDependencies {
	antennasRepository: AntennasRepository;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createTimelineServices(deps: TimelineServicesDependencies) {
	const antennaEntityService = new AntennaEntityService(deps.antennasRepository, deps.idService);

	return {
		AntennaEntityService: antennaEntityService,
	};
}

export type TimelineServices = ReturnType<typeof createTimelineServices>;
