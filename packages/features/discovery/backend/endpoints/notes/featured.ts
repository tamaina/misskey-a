/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { isUserRelated } from '@features/relationships/backend/utility/is-user-related.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FeaturedService } from '../../services/FeaturedService.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
export interface NotesFeaturedDependencies {
	notesRepository: NotesRepository;
	cacheService: CacheService;
	noteEntityService: NoteEntityService;
	featuredService: FeaturedService;
	queryService: QueryService;
}
export function createNotesFeaturedProcedure<Actor extends MiLocalUser>(deps: NotesFeaturedDependencies) {
	let globalNotesRankingCache: string[] = [];
	let globalNotesRankingCacheLastFetchedAt = 0;
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['notes/featured']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		let noteIds: string[];
		if (ps.channelId) {
			noteIds = await deps.featuredService.getInChannelNotesRanking(ps.channelId, 50);
		} else {
			if (globalNotesRankingCacheLastFetchedAt !== 0 && (Date.now() - globalNotesRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
				noteIds = globalNotesRankingCache;
			} else {
				noteIds = await deps.featuredService.getGlobalNotesRanking(100);
				globalNotesRankingCache = noteIds;
				globalNotesRankingCacheLastFetchedAt = Date.now();
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
			deps.cacheService.userMutingsCache.fetch(me.id),
			deps.cacheService.userBlockedCache.fetch(me.id),
		]) : [new Set<string>(), new Set<string>()];

		const query = deps.notesRepository.createQueryBuilder('note')
			.where('note.id IN (:...noteIds)', { noteIds: noteIds })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.leftJoinAndSelect('note.channel', 'channel');

		deps.queryService.generateBlockedHostQueryForNote(query);
		deps.queryService.generateSuspendedUserQueryForNote(query);
		if (me == null) deps.queryService.generateUgcVisibilityQueryForVisitor(query);

		const notes = (await query.getMany()).filter(note => {
			if (me && isUserRelated(note, userIdsWhoBlockingMe)) return false;
			if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;

			return true;
		});

		notes.sort((a, b) => a.id > b.id ? -1 : 1);

		return (await deps.noteEntityService.packMany(notes.slice(0, ps.limit), me)).map(toPackedNote);
	};
	return {
		canonical: createApiProcedure<Actor>()(discoveryContract['notes/featured']).handler(handler),
		get: createApiProcedure<Actor>()(discoveryContract['notes/featured:get']).use(decodeScalarInput<Actor>({ limit: 'integer' })).handler(handler),
	};
}
