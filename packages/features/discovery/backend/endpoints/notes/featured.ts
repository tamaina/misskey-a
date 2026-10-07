/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesFeaturedDefinition, packedNotesFeaturedInput, packedNotesFeaturedOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';

import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { FeaturedService } from '../../services/FeaturedService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';

const contractProjection = projectEndpointContract(packedNotesFeaturedDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedNotesFeaturedInput, typeof packedNotesFeaturedOutput> {
	private globalNotesRankingCache: string[] = [];
	private globalNotesRankingCacheLastFetchedAt = 0;

	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private cacheService: CacheService,
		private noteEntityService: NoteEntityService,
		private featuredService: FeaturedService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			let noteIds: string[];
			if (ps.channelId) {
				noteIds = await this.featuredService.getInChannelNotesRanking(ps.channelId, 50);
			} else {
				if (this.globalNotesRankingCacheLastFetchedAt !== 0 && (Date.now() - this.globalNotesRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
					noteIds = this.globalNotesRankingCache;
				} else {
					noteIds = await this.featuredService.getGlobalNotesRanking(100);
					this.globalNotesRankingCache = noteIds;
					this.globalNotesRankingCacheLastFetchedAt = Date.now();
				}
			}

			noteIds.sort((a, b) => a > b ? -1 : 1);
			if (ps.untilId) {
				noteIds = noteIds.filter(id => id < ps.untilId!);
			}
			if (noteIds.length === 0) {
				return [];
			}

			const [
				userIdsWhoMeMuting,
				userIdsWhoBlockingMe,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			]) : [new Set<string>(), new Set<string>()];

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
			if (me == null) this.queryService.generateUgcVisibilityQueryForVisitor(query);

			const notes = (await query.getMany()).filter(note => {
				if (me && isUserRelated(note, userIdsWhoBlockingMe)) return false;
				if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;

				return true;
			});

			notes.sort((a, b) => a.id > b.id ? -1 : 1);

			return await this.noteEntityService.packMany(notes.slice(0, ps.limit), me);
		});
	}
}
