/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { isUserRelated } from '@features/relationships/backend/utility/is-user-related.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FeaturedService } from '../../services/FeaturedService.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
export interface UsersFeaturedNotesDependencies {
	notesRepository: NotesRepository;
	noteEntityService: NoteEntityService;
	featuredService: FeaturedService;
	cacheService: CacheService;
	queryService: QueryService;
}
export function createUsersFeaturedNotesProcedure<Actor extends MiLocalUser>(deps: UsersFeaturedNotesDependencies) {
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['users/featured-notes']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const userIdsWhoBlockingMe = me ? await deps.cacheService.userBlockedCache.fetch(me.id) : new Set<string>();

		// early return if me is blocked by requesting user
		if (userIdsWhoBlockingMe.has(ps.userId)) {
			return [];
		}

		let noteIds = await deps.featuredService.getPerUserNotesRanking(ps.userId, 50);

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
			deps.cacheService.userMutingsCache.fetch(me.id),
		]) : [new Set<string>()];

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

		const notes = (await query.getMany()).filter(note => {
			if (me && isUserRelated(note, userIdsWhoBlockingMe, false)) return false;
			if (me && isUserRelated(note, userIdsWhoMeMuting, true)) return false;

			return true;
		});

		notes.sort((a, b) => a.id > b.id ? -1 : 1);

		return (await deps.noteEntityService.packMany(notes, me)).map(toPackedNote);
	};
	return {
		canonical: createApiProcedure<Actor>()(discoveryContract['users/featured-notes']).handler(handler),
		get: createApiProcedure<Actor>()(discoveryContract['users/featured-notes:get']).use(decodeScalarInput<Actor>({ limit: 'integer' })).handler(handler),
	};
}
