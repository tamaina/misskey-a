/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../management.contract.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DriveFileEntityService } from '../../serializers/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class DriveStreamOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private queryService: QueryService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/stream'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const query = this.queryService.makePaginationQuery(this.driveFilesRepository.createQueryBuilder('file'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('file.userId = :userId', { userId: me.id });

		if (ps.type) {
			if (ps.type.endsWith('/*')) {
				query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
			} else {
				query.andWhere('file.type = :type', { type: ps.type });
			}
		}

		const files = await query.limit(ps.limit).getMany();

		return await this.driveFileEntityService.packMany(files, { detail: false, self: true });
	}
}
