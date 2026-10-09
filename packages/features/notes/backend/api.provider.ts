/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { PromoNotesRepository } from '@features/persistence/backend/repositories/models.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NotePiningService } from './services/NotePiningService.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteEntityService } from './serializers/NoteEntityService.js';
import { QueryService } from './services/QueryService.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import { NoteCreateService } from './services/NoteCreateService.js';
import type { NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteDraftService } from './services/NoteDraftService.js';
import { NoteDraftEntityService } from './serializers/NoteDraftEntityService.js';
import type { PollsRepository } from '@features/persistence/backend/repositories/models.js';
import type { PollVotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MutingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { PollService } from './services/PollService.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserBlockingService } from '@features/relationships/backend/services/UserBlockingService.js';
import type { NoteReactionsRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteReactionEntityService } from './serializers/NoteReactionEntityService.js';
import type { NoteThreadMutingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { NoteDeleteService } from './services/NoteDeleteService.js';
import { ReactionService } from './services/ReactionService.js';
import type { PromoReadsRepository } from '@features/persistence/backend/repositories/models.js';
import { apiError } from '../../api/backend/transport/orpc-error.js';
import { createNotesRouter } from './api.router.js';
type FeatureRouter = ReturnType<typeof createNotesRouter>;
@Injectable()
export class NotesApiProvider {
	private router: FeatureRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): FeatureRouter {
		if (this.router !== undefined) return this.router;
		const getter = this.moduleRef.get(GetterService, { strict: false });
		const users = this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false });
		const deletion = this.moduleRef.get(NoteDeleteService, { strict: false });
		const drafts = this.moduleRef.get(NoteDraftService, { strict: false });
		const reactions = this.moduleRef.get(ReactionService, { strict: false });
		const threadMutings = this.moduleRef.get<NoteThreadMutingsRepository>(DI.noteThreadMutingsRepository, { strict: false });
		const notes = this.moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false });
		const promoReads = this.moduleRef.get<PromoReadsRepository>(DI.promoReadsRepository, { strict: false });
		const ids = this.moduleRef.get(IdService, { strict: false });
		const roles = this.moduleRef.get(RoleService, { strict: false });
		this.router = createNotesRouter({
			promoNotesRepository: this.moduleRef.get<PromoNotesRepository>(DI.promoNotesRepository, { strict: false }),
			getterService: getter,
			userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			notePiningService: this.moduleRef.get(NotePiningService, { strict: false }),
			notesRepository: notes,
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			serverSettings: this.moduleRef.get<MiMeta>(DI.meta, { strict: false }),
			noteCreateService: this.moduleRef.get(NoteCreateService, { strict: false }),
			noteDraftsRepository: this.moduleRef.get<NoteDraftsRepository>(DI.noteDraftsRepository, { strict: false }),
			noteDraftService: drafts,
			noteDraftEntityService: this.moduleRef.get(NoteDraftEntityService, { strict: false }),
			pollsRepository: this.moduleRef.get<PollsRepository>(DI.pollsRepository, { strict: false }),
			pollVotesRepository: this.moduleRef.get<PollVotesRepository>(DI.pollVotesRepository, { strict: false }),
			mutingsRepository: this.moduleRef.get<MutingsRepository>(DI.mutingsRepository, { strict: false }),
			usersRepository: users,
			idService: ids,
			queueService: this.moduleRef.get(QueueService, { strict: false }),
			pollService: this.moduleRef.get(PollService, { strict: false }),
			apRendererService: this.moduleRef.get(ApRendererService, { strict: false }),
			globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
			userBlockingService: this.moduleRef.get(UserBlockingService, { strict: false }),
			noteReactionsRepository: this.moduleRef.get<NoteReactionsRepository>(DI.noteReactionsRepository, { strict: false }),
			noteReactionEntityService: this.moduleRef.get(NoteReactionEntityService, { strict: false }),
			noteThreadMutingsRepository: threadMutings,
			noteFavoritesRepository: this.moduleRef.get<NoteFavoritesRepository>(DI.noteFavoritesRepository, { strict: false }),
			httpRequestService: this.moduleRef.get(HttpRequestService, { strict: false }),
			roleService: roles,
			userProfilesRepository: this.moduleRef.get<UserProfilesRepository>(DI.userProfilesRepository, { strict: false }),
			cacheService: this.moduleRef.get(CacheService, { strict: false }),
			getNote: id => getter.getNote(id),
			findUserByIdOrFail: id => users.findOneByOrFail({ id }),
			deleteNote: (author, note, quiet, deleter) => deletion.delete(author, note, quiet, deleter),
			getDraft: (actor, id) => drafts.get(actor, id),
			deleteDraft: (actor, id) => drafts.delete(actor, id),
			createReaction: (actor, note, reaction) => reactions.create(actor, note, reaction),
			deleteReaction: (actor, note) => reactions.delete(actor, note),
			threadMuteExists: (threadId, userId) => threadMutings.exists({ where: { threadId, userId } }),
			insertThreadMute: (id, threadId, userId) => threadMutings.insert({ id, threadId, userId }),
			deleteThreadMute: (threadId, userId) => threadMutings.delete({ threadId, userId }),
			findRenotesByUserAndRenote: (userId, renoteId) => notes.findBy({ userId, renoteId }),
			promoReadExists: (noteId, userId) => promoReads.exists({ where: { noteId, userId } }),
			insertPromoRead: (id, noteId, userId) => promoReads.insert({ id, noteId, userId }),
			newId: () => ids.gen(),
			createError: definition => apiError(definition),
			isModerator: actor => roles.isModerator(actor),
			findAuthor: id => users.findOneByOrFail({ id }),
			delete: (author, note, quiet, actor) => deletion.delete(author, note, quiet, actor),
		});
		return this.router;
	}
}
