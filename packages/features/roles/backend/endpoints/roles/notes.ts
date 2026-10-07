/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedRolesNotesDefinition, packedRolesNotesInput, packedRolesNotesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Brackets } from 'typeorm';

import type { NotesRepository, RolesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { FanoutTimelineService } from '@features/timelines/backend/services/FanoutTimelineService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedRolesNotesDefinition);

export const meta = {
	tags: ['role', 'notes'],

	requireCredential: true,
	kind: 'read:account',

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: 'eb70323a-df61-4dd4-ad90-89c83c7cf26e',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedRolesNotesInput, typeof packedRolesNotesOutput> {
	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private idService: IdService,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private fanoutTimelineService: FanoutTimelineService,
		private channelMutingService: ChannelMutingService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const role = await this.rolesRepository.findOneBy({
				id: ps.roleId,
				isPublic: true,
			});

			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}
			if (!role.isExplorable) {
				return [];
			}

			let noteIds = await this.fanoutTimelineService.get(`roleTimeline:${role.id}`, untilId, sinceId);
			noteIds = noteIds.slice(0, ps.limit);

			if (noteIds.length === 0) {
				return [];
			}

			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.andWhere('(note.visibility = \'public\')')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			// -- ミュートされたチャンネル対策
			const mutingChannelIds = await this.channelMutingService
				.list({ requestUserId: me.id }, { idOnly: true })
				.then(x => x.map(x => x.id));
			if (mutingChannelIds.length > 0) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.channelId IS NULL');
					qb.orWhere('note.channelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
				}));
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.renoteChannelId IS NULL');
					qb.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
				}));
			}

			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateBaseNoteFilteringQuery(query, me);

			const notes = await query.getMany();
			notes.sort((a, b) => a.id > b.id ? -1 : 1);

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
