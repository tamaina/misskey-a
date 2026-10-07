/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedDriveFilesAttachedNotesDefinition, packedDriveFilesAttachedNotesInput, packedDriveFilesAttachedNotesOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { NotesRepository, DriveFilesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '../../../../../notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '../../../../../roles/backend/services/RoleService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedDriveFilesAttachedNotesDefinition);

export const meta = {
	tags: ['drive', 'notes'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Find the notes to which the given file is attached.',

	res: contractProjection.response,

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'c118ece3-2e4b-4296-99d1-51756e32d232',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedDriveFilesAttachedNotesInput, typeof packedDriveFilesAttachedNotesOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Fetch file
			const file = await this.driveFilesRepository.findOneBy({
				id: ps.fileId,
				userId: await this.roleService.isModerator(me) ? undefined : me.id,
			});

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			query.andWhere(':file <@ note.fileIds', { file: [file.id] });

			const notes = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me, {
				detail: true,
			});
		});
	}
}
