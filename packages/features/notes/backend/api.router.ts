/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { notesApiContract } from './api.contract.js';
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
import type { NotesDependencies } from './api.dependencies.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
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
