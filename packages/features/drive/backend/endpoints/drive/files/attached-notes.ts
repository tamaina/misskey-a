/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFilesAttachedNotesErrors } from './attached-notes.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { NotesRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFilesAttachedNotesOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/attached-notes'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		// Fetch file
		const file = await this.driveFilesRepository.findOneBy({
			id: ps.fileId,
			userId: await this.roleService.isModerator(me) ? undefined : me.id,
		});

		if (file == null) {
			throw apiError(driveFilesAttachedNotesErrors.noSuchFile);
		}

		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
		query.andWhere(':file <@ note.fileIds', { file: [file.id] });

		const notes = await query.limit(ps.limit).getMany();

		return await this.noteEntityService.packMany(notes, me, {
			detail: true,
		});
	}
}
