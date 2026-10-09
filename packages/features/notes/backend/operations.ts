/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { adminPromoCreateInput, adminPromoCreateOutput } from './endpoints/admin/promo/create.contract.js';
import { iPinInput, iPinOutput } from './endpoints/i/pin.contract.js';
import { iUnpinInput, iUnpinOutput } from './endpoints/i/unpin.contract.js';
import { notesInput, notesOutput } from './endpoints/notes.contract.js';
import { notesChildrenInput, notesChildrenOutput } from './endpoints/notes/children.contract.js';
import { notesConversationInput, notesConversationOutput } from './endpoints/notes/conversation.contract.js';
import { notesCreateInput, notesCreateOutput } from './endpoints/notes/create.contract.js';
import { notesDraftsListInput, notesDraftsListOutput } from './endpoints/notes/drafts/list.contract.js';
import { notesDraftsCreateInput, notesDraftsCreateOutput } from './endpoints/notes/drafts/create.contract.js';
import { notesDraftsDeleteInput, notesDraftsDeleteOutput } from './endpoints/notes/drafts/delete.contract.js';
import { notesDraftsUpdateInput, notesDraftsUpdateOutput } from './endpoints/notes/drafts/update.contract.js';
import { notesDraftsCountInput, notesDraftsCountOutput } from './endpoints/notes/drafts/count.contract.js';
import { notesPollsRecommendationInput, notesPollsRecommendationOutput } from './endpoints/notes/polls/recommendation.contract.js';
import { notesPollsVoteInput, notesPollsVoteOutput } from './endpoints/notes/polls/vote.contract.js';
import { notesReactionsInput, notesReactionsOutput } from './endpoints/notes/reactions.contract.js';
import { notesReactionsCreateInput, notesReactionsCreateOutput } from './endpoints/notes/reactions/create.contract.js';
import { notesReactionsDeleteInput, notesReactionsDeleteOutput } from './endpoints/notes/reactions/delete.contract.js';
import { notesRenotesInput, notesRenotesOutput } from './endpoints/notes/renotes.contract.js';
import { notesRepliesInput, notesRepliesOutput } from './endpoints/notes/replies.contract.js';
import { notesShowInput, notesShowOutput } from './endpoints/notes/show.contract.js';
import { notesShowPartialBulkInput, notesShowPartialBulkOutput } from './endpoints/notes/show-partial-bulk.contract.js';
import { notesStateInput, notesStateOutput } from './endpoints/notes/state.contract.js';
import { notesThreadMutingCreateInput, notesThreadMutingCreateOutput } from './endpoints/notes/thread-muting/create.contract.js';
import { notesThreadMutingDeleteInput, notesThreadMutingDeleteOutput } from './endpoints/notes/thread-muting/delete.contract.js';
import { notesTranslateInput, notesTranslateOutput } from './endpoints/notes/translate.contract.js';
import { notesUnrenoteInput, notesUnrenoteOutput } from './endpoints/notes/unrenote.contract.js';
import { promoReadInput, promoReadOutput } from './endpoints/promo/read.contract.js';
import { usersReactionsInput, usersReactionsOutput } from './endpoints/users/reactions.contract.js';
import { AdminPromoCreateOperation } from './endpoints/admin/promo/create.js';
import { IPinOperation } from './endpoints/i/pin.js';
import { IUnpinOperation } from './endpoints/i/unpin.js';
import { NotesOperation } from './endpoints/notes.js';
import { NotesChildrenOperation } from './endpoints/notes/children.js';
import { NotesConversationOperation } from './endpoints/notes/conversation.js';
import { NotesCreateOperation } from './endpoints/notes/create.js';
import { NotesDraftsListOperation } from './endpoints/notes/drafts/list.js';
import { NotesDraftsCreateOperation } from './endpoints/notes/drafts/create.js';
import { NotesDraftsUpdateOperation } from './endpoints/notes/drafts/update.js';
import { NotesDraftsCountOperation } from './endpoints/notes/drafts/count.js';
import { NotesPollsRecommendationOperation } from './endpoints/notes/polls/recommendation.js';
import { NotesPollsVoteOperation } from './endpoints/notes/polls/vote.js';
import { NotesReactionsOperation } from './endpoints/notes/reactions.js';
import { NotesRenotesOperation } from './endpoints/notes/renotes.js';
import { NotesRepliesOperation } from './endpoints/notes/replies.js';
import { NotesShowOperation } from './endpoints/notes/show.js';
import { NotesShowPartialBulkOperation } from './endpoints/notes/show-partial-bulk.js';
import { NotesStateOperation } from './endpoints/notes/state.js';
import { NotesTranslateOperation } from './endpoints/notes/translate.js';
import { UsersReactionsOperation } from './endpoints/users/reactions.js';
import type { NotesCommandOperations } from './commands.js';
import type { MiNoteDraft } from './models/NoteDraft.js';
import type { MiNote } from './models/Note.js';
import type { MiLocalUser, MiUser } from '../../users/backend/models/User.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type * as v from 'valibot';

export interface NotesOperations<Actor extends ApiActor> {
	adminPromoCreate(input: v.InferOutput<typeof adminPromoCreateInput>, actor: Actor): Promise<v.InferOutput<typeof adminPromoCreateOutput>>;
	iPin(input: v.InferOutput<typeof iPinInput>, actor: Actor): Promise<v.InferOutput<typeof iPinOutput>>;
	iUnpin(input: v.InferOutput<typeof iUnpinInput>, actor: Actor): Promise<v.InferOutput<typeof iUnpinOutput>>;
	notes(input: v.InferOutput<typeof notesInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesOutput>>;
	notesChildren(input: v.InferOutput<typeof notesChildrenInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesChildrenOutput>>;
	notesConversation(input: v.InferOutput<typeof notesConversationInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesConversationOutput>>;
	notesCreate(input: v.InferOutput<typeof notesCreateInput>, actor: Actor): Promise<v.InferOutput<typeof notesCreateOutput>>;
	notesDraftsList(input: v.InferOutput<typeof notesDraftsListInput>, actor: Actor): Promise<v.InferOutput<typeof notesDraftsListOutput>>;
	notesDraftsCreate(input: v.InferOutput<typeof notesDraftsCreateInput>, actor: Actor): Promise<v.InferOutput<typeof notesDraftsCreateOutput>>;
	notesDraftsDelete(input: v.InferOutput<typeof notesDraftsDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof notesDraftsDeleteOutput>>;
	notesDraftsUpdate(input: v.InferOutput<typeof notesDraftsUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof notesDraftsUpdateOutput>>;
	notesDraftsCount(input: v.InferOutput<typeof notesDraftsCountInput>, actor: Actor): Promise<v.InferOutput<typeof notesDraftsCountOutput>>;
	notesPollsRecommendation(input: v.InferOutput<typeof notesPollsRecommendationInput>, actor: Actor): Promise<v.InferOutput<typeof notesPollsRecommendationOutput>>;
	notesPollsVote(input: v.InferOutput<typeof notesPollsVoteInput>, actor: Actor): Promise<v.InferOutput<typeof notesPollsVoteOutput>>;
	notesReactions(input: v.InferOutput<typeof notesReactionsInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesReactionsOutput>>;
	notesReactionsCreate(input: v.InferOutput<typeof notesReactionsCreateInput>, actor: Actor): Promise<v.InferOutput<typeof notesReactionsCreateOutput>>;
	notesReactionsDelete(input: v.InferOutput<typeof notesReactionsDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof notesReactionsDeleteOutput>>;
	notesRenotes(input: v.InferOutput<typeof notesRenotesInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesRenotesOutput>>;
	notesReplies(input: v.InferOutput<typeof notesRepliesInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesRepliesOutput>>;
	notesShow(input: v.InferOutput<typeof notesShowInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesShowOutput>>;
	notesShowPartialBulk(input: v.InferOutput<typeof notesShowPartialBulkInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesShowPartialBulkOutput>>;
	notesState(input: v.InferOutput<typeof notesStateInput>, actor: Actor): Promise<v.InferOutput<typeof notesStateOutput>>;
	notesThreadMutingCreate(input: v.InferOutput<typeof notesThreadMutingCreateInput>, actor: Actor): Promise<v.InferOutput<typeof notesThreadMutingCreateOutput>>;
	notesThreadMutingDelete(input: v.InferOutput<typeof notesThreadMutingDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof notesThreadMutingDeleteOutput>>;
	notesTranslate(input: v.InferOutput<typeof notesTranslateInput>, actor: Actor): Promise<v.InferOutput<typeof notesTranslateOutput>>;
	notesUnrenote(input: v.InferOutput<typeof notesUnrenoteInput>, actor: Actor): Promise<v.InferOutput<typeof notesUnrenoteOutput>>;
	promoRead(input: v.InferOutput<typeof promoReadInput>, actor: Actor): Promise<v.InferOutput<typeof promoReadOutput>>;
	usersReactions(input: v.InferOutput<typeof usersReactionsInput>, actor: Actor | null): Promise<v.InferOutput<typeof usersReactionsOutput>>;
}

export type NotesApiContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { notes: NotesOperations<Actor> } };

export const notesOperationProviders = [
	AdminPromoCreateOperation,
	IPinOperation,
	IUnpinOperation,
	NotesOperation,
	NotesChildrenOperation,
	NotesConversationOperation,
	NotesCreateOperation,
	NotesDraftsListOperation,
	NotesDraftsCreateOperation,
	NotesDraftsUpdateOperation,
	NotesDraftsCountOperation,
	NotesPollsRecommendationOperation,
	NotesPollsVoteOperation,
	NotesReactionsOperation,
	NotesRenotesOperation,
	NotesRepliesOperation,
	NotesShowOperation,
	NotesShowPartialBulkOperation,
	NotesStateOperation,
	NotesTranslateOperation,
	UsersReactionsOperation,
];

export interface NotesOperationDependencies {
	adminPromoCreate: Pick<AdminPromoCreateOperation, 'execute'>;
	iPin: Pick<IPinOperation, 'execute'>;
	iUnpin: Pick<IUnpinOperation, 'execute'>;
	notes: Pick<NotesOperation, 'execute'>;
	notesChildren: Pick<NotesChildrenOperation, 'execute'>;
	notesConversation: Pick<NotesConversationOperation, 'execute'>;
	notesCreate: Pick<NotesCreateOperation, 'execute'>;
	notesDraftsList: Pick<NotesDraftsListOperation, 'execute'>;
	notesDraftsCreate: Pick<NotesDraftsCreateOperation, 'execute'>;
	notesDraftsUpdate: Pick<NotesDraftsUpdateOperation, 'execute'>;
	notesDraftsCount: Pick<NotesDraftsCountOperation, 'execute'>;
	notesPollsRecommendation: Pick<NotesPollsRecommendationOperation, 'execute'>;
	notesPollsVote: Pick<NotesPollsVoteOperation, 'execute'>;
	notesReactions: Pick<NotesReactionsOperation, 'execute'>;
	notesRenotes: Pick<NotesRenotesOperation, 'execute'>;
	notesReplies: Pick<NotesRepliesOperation, 'execute'>;
	notesShow: Pick<NotesShowOperation, 'execute'>;
	notesShowPartialBulk: Pick<NotesShowPartialBulkOperation, 'execute'>;
	notesState: Pick<NotesStateOperation, 'execute'>;
	notesTranslate: Pick<NotesTranslateOperation, 'execute'>;
	usersReactions: Pick<UsersReactionsOperation, 'execute'>;
	commands: NotesCommandOperations<MiLocalUser, MiNote, MiNoteDraft, MiUser>;
}

export function createNotesOperations(deps: NotesOperationDependencies): NotesOperations<MiLocalUser> {
	return {
		adminPromoCreate: (input, actor) => deps.adminPromoCreate.execute(input, actor),
		iPin: (input, actor) => deps.iPin.execute(input, actor),
		iUnpin: (input, actor) => deps.iUnpin.execute(input, actor),
		notes: (input, actor) => deps.notes.execute(input, actor),
		notesChildren: (input, actor) => deps.notesChildren.execute(input, actor),
		notesConversation: (input, actor) => deps.notesConversation.execute(input, actor),
		notesCreate: (input, actor) => deps.notesCreate.execute(input, actor),
		notesDraftsList: (input, actor) => deps.notesDraftsList.execute(input, actor),
		notesDraftsCreate: (input, actor) => deps.notesDraftsCreate.execute(input, actor),
		notesDraftsDelete: (input, actor) => deps.commands.notesDraftsDelete(input, actor),
		notesDraftsUpdate: (input, actor) => deps.notesDraftsUpdate.execute(input, actor),
		notesDraftsCount: (input, actor) => deps.notesDraftsCount.execute(input, actor),
		notesPollsRecommendation: (input, actor) => deps.notesPollsRecommendation.execute(input, actor),
		notesPollsVote: (input, actor) => deps.notesPollsVote.execute(input, actor),
		notesReactions: (input, actor) => deps.notesReactions.execute(input, actor),
		notesReactionsCreate: (input, actor) => deps.commands.notesReactionsCreate(input, actor),
		notesReactionsDelete: (input, actor) => deps.commands.notesReactionsDelete(input, actor),
		notesRenotes: (input, actor) => deps.notesRenotes.execute(input, actor),
		notesReplies: (input, actor) => deps.notesReplies.execute(input, actor),
		notesShow: (input, actor) => deps.notesShow.execute(input, actor),
		notesShowPartialBulk: (input, actor) => deps.notesShowPartialBulk.execute(input, actor),
		notesState: (input, actor) => deps.notesState.execute(input, actor),
		notesThreadMutingCreate: (input, actor) => deps.commands.notesThreadMutingCreate(input, actor),
		notesThreadMutingDelete: (input, actor) => deps.commands.notesThreadMutingDelete(input, actor),
		notesTranslate: (input, actor) => deps.notesTranslate.execute(input, actor),
		notesUnrenote: (input, actor) => deps.commands.notesUnrenote(input, actor),
		promoRead: (input, actor) => deps.commands.promoRead(input, actor),
		usersReactions: (input, actor) => deps.usersReactions.execute(input, actor),
	};
}
