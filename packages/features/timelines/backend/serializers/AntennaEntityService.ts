/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { bindThis } from '@features/runtime/backend/decorators.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { PackedAntenna } from '../antenna.schema.js';
import type { MiAntenna } from '../models/Antenna.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';

export class AntennaEntityService {
	constructor(
		private antennasRepository: AntennasRepository,

		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiAntenna['id'] | MiAntenna,
	): Promise<PackedAntenna> {
		const antenna = typeof src === 'object' ? src : await this.antennasRepository.findOneByOrFail({ id: src });

		return {
			id: antenna.id,
			createdAt: this.idService.parse(antenna.id).date.toISOString(),
			name: antenna.name,
			keywords: antenna.keywords,
			excludeKeywords: antenna.excludeKeywords,
			src: antenna.src,
			userListId: antenna.userListId,
			users: antenna.users,
			caseSensitive: antenna.caseSensitive,
			localOnly: antenna.localOnly,
			excludeBots: antenna.excludeBots,
			withReplies: antenna.withReplies,
			withFile: antenna.withFile,
			excludeNotesInSensitiveChannel: antenna.excludeNotesInSensitiveChannel,
			isActive: antenna.isActive,
			hasUnreadNote: false, // TODO
			notify: false, // 後方互換性のため
		};
	}
}
