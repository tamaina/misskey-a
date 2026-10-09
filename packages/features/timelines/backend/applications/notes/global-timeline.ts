/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';

import { notesGlobalTimelineInput, notesGlobalTimelineErrors } from '../../endpoints/notes/global-timeline.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class NotesGlobalTimelineApplicationService {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
	) {}

	async execute(ps: v.InferOutput<typeof notesGlobalTimelineInput>, me: MiLocalUser | null) {
		const policies = await this.roleService.getUserPolicies(me ? me.id : null);
		if (!policies.gtlAvailable) {
			throw apiError(notesGlobalTimelineErrors.gtlDisabled);
		}

		//#region Construct query
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('note.visibility = \'public\'')
			.andWhere('note.channelId IS NULL')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		this.queryService.generateBaseNoteFilteringQuery(query, me);
		if (me == null) this.queryService.generateUgcVisibilityQueryForVisitor(query);
		if (me) this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}

		if (ps.withRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.where('note.renoteId IS NULL');
				qb.orWhere(new Brackets(qb => {
					qb.where('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
					qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
				}));
			}));
		}
		//#endregion

		const timeline = await query.limit(ps.limit).getMany();

		process.nextTick(() => {
			if (me) {
				this.activeUsersChart.read(me);
			}
		});

		return await this.noteEntityService.packMany(timeline, me);
	}
}
