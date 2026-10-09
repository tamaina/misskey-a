/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ModerationLogsRepository } from '@features/persistence/backend/repositories/models.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { ModerationLogPayloads } from '@features/runtime/backend/types.js';
import { moderationLogTypes } from '@features/runtime/backend/types.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiUser } from '@features/users/backend/models/User.js';

export class ModerationLogService {
	constructor(
		private moderationLogsRepository: ModerationLogsRepository,

		private idService: IdService,
	) {
	}

	@bindThis
	public async log<T extends typeof moderationLogTypes[number]>(moderator: { id: MiUser['id'] }, type: T, info?: ModerationLogPayloads[T]) {
		await this.moderationLogsRepository.insert({
			id: this.idService.gen(),
			userId: moderator.id,
			type: type,
			info: (info as any) ?? {},
		});
	}
}
