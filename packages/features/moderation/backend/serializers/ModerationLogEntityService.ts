/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ModerationLogsRepository } from '@features/persistence/backend/repositories/models.js';
import { awaitAll } from '@features/runtime/backend/async/await-all.js';
import type { } from '@features/relationships/backend/models/Blocking.js';
import { MiModerationLog } from '../models/ModerationLog.js';
import { bindThis } from '@/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Packed } from '@features/index/contract/packed.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

export class ModerationLogEntityService {
	constructor(
		private moderationLogsRepository: ModerationLogsRepository,

		private userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>,
		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiModerationLog['id'] | MiModerationLog,
		hint?: {
			packedUser?: Packed<'UserDetailedNotMe'>,
		},
	) {
		const log = typeof src === 'object' ? src : await this.moderationLogsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: log.id,
			createdAt: this.idService.parse(log.id).date.toISOString(),
			type: log.type,
			info: log.info,
			userId: log.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(log.user ?? log.userId, null, {
				schema: 'UserDetailedNotMe',
			}),
		});
	}

	@bindThis
	public async packMany(
		reports: MiModerationLog[],
	) {
		const _users = reports.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, null, { schema: 'UserDetailedNotMe' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(reports.map(report => this.pack(report, { packedUser: _userMap.get(report.userId) })));
	}
}
