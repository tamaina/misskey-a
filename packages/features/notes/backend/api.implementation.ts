/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PromoNotesRepository, NotesRepository, MiMeta, NoteDraftsRepository, PollsRepository, PollVotesRepository, MutingsRepository, UsersRepository, NoteReactionsRepository, NoteThreadMutingsRepository, NoteFavoritesRepository, UserProfilesRepository, PromoReadsRepository } from '@features/persistence/backend/repositories/models.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NotePiningService } from './services/NotePiningService.js';
import { NoteEntityService } from './serializers/NoteEntityService.js';
import { QueryService } from './services/QueryService.js';
import { NoteCreateService } from './services/NoteCreateService.js';
import { NoteDraftService } from './services/NoteDraftService.js';
import { NoteDraftEntityService } from './serializers/NoteDraftEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { PollService } from './services/PollService.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserBlockingService } from '@features/relationships/backend/services/UserBlockingService.js';
import { NoteReactionEntityService } from './serializers/NoteReactionEntityService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import type { NotesCommandDependencies } from './command.dependencies.js';
import type { DeleteNoteDependencies } from './delete-note.js';
import type { MiLocalUser, MiUser } from '@features/users/backend/models/User.js';
import type { MiNote } from './models/Note.js';
import { implement } from '@orpc/server';
import { notesApiContract } from './api.definition.js';
import { createDeleteProcedure } from './endpoints/notes/delete.js';
import { createAdminPromoCreateProcedure } from './endpoints/admin/promo/create.js';
import { createIPinProcedure } from './endpoints/i/pin.js';
import { createIUnpinProcedure } from './endpoints/i/unpin.js';
import { createNotesProcedure } from './endpoints/notes.js';
import { createNotesChildrenProcedure } from './endpoints/notes/children.js';
import { createNotesConversationProcedure } from './endpoints/notes/conversation.js';
import { createNotesCreateProcedure } from './endpoints/notes/create.js';
import { createNotesDraftsListProcedure } from './endpoints/notes/drafts/list.js';
import { createNotesDraftsCreateProcedure } from './endpoints/notes/drafts/create.js';
import { createNotesDraftsDeleteProcedure } from './endpoints/notes/drafts/delete.js';
import { createNotesDraftsUpdateProcedure } from './endpoints/notes/drafts/update.js';
import { createNotesDraftsCountProcedure } from './endpoints/notes/drafts/count.js';
import { createNotesPollsRecommendationProcedure } from './endpoints/notes/polls/recommendation.js';
import { createNotesPollsVoteProcedure } from './endpoints/notes/polls/vote.js';
import { createNotesReactionsProcedure } from './endpoints/notes/reactions.js';
import { createNotesReactionsCreateProcedure } from './endpoints/notes/reactions/create.js';
import { createNotesReactionsDeleteProcedure } from './endpoints/notes/reactions/delete.js';
import { createNotesRenotesProcedure } from './endpoints/notes/renotes.js';
import { createNotesRepliesProcedure } from './endpoints/notes/replies.js';
import { createNotesShowProcedure } from './endpoints/notes/show.js';
import { createNotesShowPartialBulkProcedure } from './endpoints/notes/show-partial-bulk.js';
import { createNotesStateProcedure } from './endpoints/notes/state.js';
import { createNotesThreadMutingCreateProcedure } from './endpoints/notes/thread-muting/create.js';
import { createNotesThreadMutingDeleteProcedure } from './endpoints/notes/thread-muting/delete.js';
import { createNotesTranslateProcedure } from './endpoints/notes/translate.js';
import { createNotesUnrenoteProcedure } from './endpoints/notes/unrenote.js';
import { createPromoReadProcedure } from './endpoints/promo/read.js';
import { createUsersReactionsProcedure } from './endpoints/users/reactions.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { NoteDeleteService } from './services/NoteDeleteService.js';
import { ReactionService } from './services/ReactionService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

export interface NotesDependencies extends NotesCommandDependencies, DeleteNoteDependencies<MiLocalUser, MiNote, MiUser> {
	promoNotesRepository: PromoNotesRepository;
	getterService: Pick<GetterService, 'getNote' | 'getNoteWithRelations'>;
	userEntityService: Pick<UserEntityService, 'packSelf' | 'isRemoteUser'>;
	notePiningService: Pick<NotePiningService, 'addPinned' | 'removePinned'>;
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany' | 'pack' | 'isVisibleForMe' | 'fetchDiffs'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBaseNoteFilteringQuery' | 'generateUgcVisibilityQueryForVisitor' | 'generateBlockedHostQueryForNote' | 'generateSuspendedUserQueryForNote'>;
	serverSettings: MiMeta;
	noteCreateService: Pick<NoteCreateService, 'fetchAndCreate'>;
	noteDraftsRepository: NoteDraftsRepository;
	noteDraftService: Pick<NoteDraftService, 'create' | 'update'>;
	noteDraftEntityService: Pick<NoteDraftEntityService, 'pack' | 'packMany'>;
	pollsRepository: PollsRepository;
	pollVotesRepository: PollVotesRepository;
	mutingsRepository: MutingsRepository;
	usersRepository: UsersRepository;
	idService: Pick<IdService, 'gen'>;
	queueService: Pick<QueueService, 'deliver'>;
	pollService: Pick<PollService, 'deliverQuestionUpdate'>;
	apRendererService: Pick<ApRendererService, 'addContext' | 'renderVote'>;
	globalEventService: Pick<GlobalEventService, 'publishNoteStream'>;
	userBlockingService: Pick<UserBlockingService, 'checkBlocked'>;
	noteReactionsRepository: NoteReactionsRepository;
	noteReactionEntityService: Pick<NoteReactionEntityService, 'packMany' | 'packManyWithNote'>;
	noteThreadMutingsRepository: NoteThreadMutingsRepository;
	noteFavoritesRepository: NoteFavoritesRepository;
	httpRequestService: Pick<HttpRequestService, 'send'>;
	roleService: Pick<RoleService, 'getUserPolicies' | 'isModerator'>;
	userProfilesRepository: UserProfilesRepository;
	cacheService: Pick<CacheService, 'userBlockedCache' | 'findUserById' | 'userMutingsCache'>;
}

export function createNotesRouter(deps: NotesDependencies) {
	return implement(notesApiContract).$context<ApiContext<MiLocalUser>>().router({
		delete: createDeleteProcedure(deps),
		adminPromoCreate: createAdminPromoCreateProcedure(deps),
		iPin: createIPinProcedure(deps),
		iUnpin: createIUnpinProcedure(deps),
		notes: createNotesProcedure(deps),
		notesChildren: createNotesChildrenProcedure(deps),
		notesConversation: createNotesConversationProcedure(deps),
		notesCreate: createNotesCreateProcedure(deps),
		notesDraftsList: createNotesDraftsListProcedure(deps),
		notesDraftsCreate: createNotesDraftsCreateProcedure(deps),
		notesDraftsDelete: createNotesDraftsDeleteProcedure(deps),
		notesDraftsUpdate: createNotesDraftsUpdateProcedure(deps),
		notesDraftsCount: createNotesDraftsCountProcedure(deps),
		notesPollsRecommendation: createNotesPollsRecommendationProcedure(deps),
		notesPollsVote: createNotesPollsVoteProcedure(deps),
		notesReactions: createNotesReactionsProcedure(deps),
		notesReactionsCreate: createNotesReactionsCreateProcedure(deps),
		notesReactionsDelete: createNotesReactionsDeleteProcedure(deps),
		notesRenotes: createNotesRenotesProcedure(deps),
		notesReplies: createNotesRepliesProcedure(deps),
		notesShow: createNotesShowProcedure(deps),
		notesShowPartialBulk: createNotesShowPartialBulkProcedure(deps),
		notesState: createNotesStateProcedure(deps),
		notesThreadMutingCreate: createNotesThreadMutingCreateProcedure(deps),
		notesThreadMutingDelete: createNotesThreadMutingDeleteProcedure(deps),
		notesTranslate: createNotesTranslateProcedure(deps),
		notesUnrenote: createNotesUnrenoteProcedure(deps),
		promoRead: createPromoReadProcedure(deps),
		usersReactions: createUsersReactionsProcedure(deps),
	});
}

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
