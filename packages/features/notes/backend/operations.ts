/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { adminPromoCreateContract } from './endpoints/admin/promo/create.contract.js';
import type { iPinContract } from './endpoints/i/pin.contract.js';
import type { iUnpinContract } from './endpoints/i/unpin.contract.js';
import type { notesContract } from './endpoints/notes.contract.js';
import type { notesChildrenContract } from './endpoints/notes/children.contract.js';
import type { notesConversationContract } from './endpoints/notes/conversation.contract.js';
import type { notesCreateContract } from './endpoints/notes/create.contract.js';
import type { notesDraftsListContract } from './endpoints/notes/drafts/list.contract.js';
import type { notesDraftsCreateContract } from './endpoints/notes/drafts/create.contract.js';
import type { notesDraftsDeleteContract } from './endpoints/notes/drafts/delete.contract.js';
import type { notesDraftsUpdateContract } from './endpoints/notes/drafts/update.contract.js';
import type { notesDraftsCountContract } from './endpoints/notes/drafts/count.contract.js';
import type { notesPollsRecommendationContract } from './endpoints/notes/polls/recommendation.contract.js';
import type { notesPollsVoteContract } from './endpoints/notes/polls/vote.contract.js';
import type { notesReactionsContract } from './endpoints/notes/reactions.contract.js';
import type { notesReactionsCreateContract } from './endpoints/notes/reactions/create.contract.js';
import type { notesReactionsDeleteContract } from './endpoints/notes/reactions/delete.contract.js';
import type { notesRenotesContract } from './endpoints/notes/renotes.contract.js';
import type { notesRepliesContract } from './endpoints/notes/replies.contract.js';
import type { notesShowContract } from './endpoints/notes/show.contract.js';
import type { notesShowPartialBulkContract } from './endpoints/notes/show-partial-bulk.contract.js';
import type { notesStateContract } from './endpoints/notes/state.contract.js';
import type { notesThreadMutingCreateContract } from './endpoints/notes/thread-muting/create.contract.js';
import type { notesThreadMutingDeleteContract } from './endpoints/notes/thread-muting/delete.contract.js';
import type { notesTranslateContract } from './endpoints/notes/translate.contract.js';
import type { notesUnrenoteContract } from './endpoints/notes/unrenote.contract.js';
import type { promoReadContract } from './endpoints/promo/read.contract.js';
import type { usersReactionsContract } from './endpoints/users/reactions.contract.js';
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

export interface NotesOperations<Actor extends ApiActor> {
	adminPromoCreate(input: InferSchemaOutput<NonNullable<typeof adminPromoCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof adminPromoCreateContract['~orpc']['outputSchema']>>>;
	iPin(input: InferSchemaOutput<NonNullable<typeof iPinContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof iPinContract['~orpc']['outputSchema']>>>;
	iUnpin(input: InferSchemaOutput<NonNullable<typeof iUnpinContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof iUnpinContract['~orpc']['outputSchema']>>>;
	notes(input: InferSchemaOutput<NonNullable<typeof notesContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesContract['~orpc']['outputSchema']>>>;
	notesChildren(input: InferSchemaOutput<NonNullable<typeof notesChildrenContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesChildrenContract['~orpc']['outputSchema']>>>;
	notesConversation(input: InferSchemaOutput<NonNullable<typeof notesConversationContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesConversationContract['~orpc']['outputSchema']>>>;
	notesCreate(input: InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['outputSchema']>>>;
	notesDraftsList(input: InferSchemaOutput<NonNullable<typeof notesDraftsListContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesDraftsListContract['~orpc']['outputSchema']>>>;
	notesDraftsCreate(input: InferSchemaOutput<NonNullable<typeof notesDraftsCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesDraftsCreateContract['~orpc']['outputSchema']>>>;
	notesDraftsDelete(input: InferSchemaOutput<NonNullable<typeof notesDraftsDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesDraftsDeleteContract['~orpc']['outputSchema']>>>;
	notesDraftsUpdate(input: InferSchemaOutput<NonNullable<typeof notesDraftsUpdateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesDraftsUpdateContract['~orpc']['outputSchema']>>>;
	notesDraftsCount(input: InferSchemaOutput<NonNullable<typeof notesDraftsCountContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesDraftsCountContract['~orpc']['outputSchema']>>>;
	notesPollsRecommendation(input: InferSchemaOutput<NonNullable<typeof notesPollsRecommendationContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesPollsRecommendationContract['~orpc']['outputSchema']>>>;
	notesPollsVote(input: InferSchemaOutput<NonNullable<typeof notesPollsVoteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesPollsVoteContract['~orpc']['outputSchema']>>>;
	notesReactions(input: InferSchemaOutput<NonNullable<typeof notesReactionsContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesReactionsContract['~orpc']['outputSchema']>>>;
	notesReactionsCreate(input: InferSchemaOutput<NonNullable<typeof notesReactionsCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesReactionsCreateContract['~orpc']['outputSchema']>>>;
	notesReactionsDelete(input: InferSchemaOutput<NonNullable<typeof notesReactionsDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesReactionsDeleteContract['~orpc']['outputSchema']>>>;
	notesRenotes(input: InferSchemaOutput<NonNullable<typeof notesRenotesContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesRenotesContract['~orpc']['outputSchema']>>>;
	notesReplies(input: InferSchemaOutput<NonNullable<typeof notesRepliesContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesRepliesContract['~orpc']['outputSchema']>>>;
	notesShow(input: InferSchemaOutput<NonNullable<typeof notesShowContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesShowContract['~orpc']['outputSchema']>>>;
	notesShowPartialBulk(input: InferSchemaOutput<NonNullable<typeof notesShowPartialBulkContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof notesShowPartialBulkContract['~orpc']['outputSchema']>>>;
	notesState(input: InferSchemaOutput<NonNullable<typeof notesStateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesStateContract['~orpc']['outputSchema']>>>;
	notesThreadMutingCreate(input: InferSchemaOutput<NonNullable<typeof notesThreadMutingCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesThreadMutingCreateContract['~orpc']['outputSchema']>>>;
	notesThreadMutingDelete(input: InferSchemaOutput<NonNullable<typeof notesThreadMutingDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesThreadMutingDeleteContract['~orpc']['outputSchema']>>>;
	notesTranslate(input: InferSchemaOutput<NonNullable<typeof notesTranslateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesTranslateContract['~orpc']['outputSchema']>>>;
	notesUnrenote(input: InferSchemaOutput<NonNullable<typeof notesUnrenoteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof notesUnrenoteContract['~orpc']['outputSchema']>>>;
	promoRead(input: InferSchemaOutput<NonNullable<typeof promoReadContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof promoReadContract['~orpc']['outputSchema']>>>;
	usersReactions(input: InferSchemaOutput<NonNullable<typeof usersReactionsContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<typeof usersReactionsContract['~orpc']['outputSchema']>>>;
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
