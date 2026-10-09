/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { driveFilesAttachedNotesErrors } from './attached-notes.contract.js';
import type { NotesRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesAttachedNotesDependencies {
	driveFilesRepository: DriveFilesRepository;
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createDriveFilesAttachedNotesProcedure(deps: DriveFilesAttachedNotesDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files/attached-notes']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				// Fetch file
				const file = await deps.driveFilesRepository.findOneBy({
					id: ps.fileId,
					userId: await deps.roleService.isModerator(me) ? undefined : me.id,
				});

				if (file == null) {
					throw apiError(driveFilesAttachedNotesErrors.noSuchFile);
				}

				const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
				query.andWhere(':file <@ note.fileIds', { file: [file.id] });

				const notes = await query.limit(ps.limit).getMany();

				return await deps.noteEntityService.packMany(notes, me, {
					detail: true,
				});
			})();
			return result.map(toPackedNote);
		});
}
