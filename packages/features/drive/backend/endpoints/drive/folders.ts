/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../management.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DriveFolderEntityService } from '../../serializers/DriveFolderEntityService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class DriveFoldersOperation {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
		private queryService: QueryService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/folders'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const query = this.queryService.makePaginationQuery(this.driveFoldersRepository.createQueryBuilder('folder'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('folder.userId = :userId', { userId: me.id });

		if (ps.folderId) {
			query.andWhere('folder.parentId = :parentId', { parentId: ps.folderId });
		} else {
			query.andWhere('folder.parentId IS NULL');
		}

		const folders = await query.limit(ps.limit).getMany();

		return await Promise.all(folders.map(folder => this.driveFolderEntityService.pack(folder)));
	}
}
