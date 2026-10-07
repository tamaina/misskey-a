/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedUsersFeaturedNotesDefinition, packedUsersFeaturedNotesInput, packedUsersFeaturedNotesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';

import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { FeaturedService } from '../../services/FeaturedService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';

const contractProjection = projectEndpointContract(packedUsersFeaturedNotesDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersFeaturedNotesInput, typeof packedUsersFeaturedNotesOutput> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private featuredService: FeaturedService,
		private cacheService: CacheService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const userIdsWhoBlockingMe = me ? await this.cacheService.userBlockedCache.fetch(me.id) : new Set<string>();

			// early return if me is blocked by requesting user
			if (userIdsWhoBlockingMe.has(ps.userId)) {
				return [];
			}

			let noteIds = await this.featuredService.getPerUserNotesRanking(ps.userId, 50);

			noteIds.sort((a, b) => a > b ? -1 : 1);
			if (ps.untilId) {
				noteIds = noteIds.filter(id => id < ps.untilId!);
			}
			noteIds = noteIds.slice(0, ps.limit);

			if (noteIds.length === 0) {
				return [];
			}

			const [
				userIdsWhoMeMuting,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
			]) : [new Set<string>()];

			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('note.channel', 'channel');

			this.queryService.generateBlockedHostQueryForNote(query);
			this.queryService.generateSuspendedUserQueryForNote(query);

			const notes = (await query.getMany()).filter(note => {
				if (me && isUserRelated(note, userIdsWhoBlockingMe, false)) return false;
				if (me && isUserRelated(note, userIdsWhoMeMuting, true)) return false;

				return true;
			});

			notes.sort((a, b) => a.id > b.id ? -1 : 1);

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
