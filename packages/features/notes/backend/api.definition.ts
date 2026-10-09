/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notesDeleteContract } from './endpoints/notes/delete.contract.js';
import { adminPromoCreateContract } from './endpoints/admin/promo/create.contract.js';
import { iPinContract } from './endpoints/i/pin.contract.js';
import { iUnpinContract } from './endpoints/i/unpin.contract.js';
import { notesContract } from './endpoints/notes.contract.js';
import { notesChildrenContract } from './endpoints/notes/children.contract.js';
import { notesConversationContract } from './endpoints/notes/conversation.contract.js';
import { notesCreateContract } from './endpoints/notes/create.contract.js';
import { notesDraftsListContract } from './endpoints/notes/drafts/list.contract.js';
import { notesDraftsCreateContract } from './endpoints/notes/drafts/create.contract.js';
import { notesDraftsDeleteContract } from './endpoints/notes/drafts/delete.contract.js';
import { notesDraftsUpdateContract } from './endpoints/notes/drafts/update.contract.js';
import { notesDraftsCountContract } from './endpoints/notes/drafts/count.contract.js';
import { notesPollsRecommendationContract } from './endpoints/notes/polls/recommendation.contract.js';
import { notesPollsVoteContract } from './endpoints/notes/polls/vote.contract.js';
import { notesReactionsContract } from './endpoints/notes/reactions.contract.js';
import { notesReactionsCreateContract } from './endpoints/notes/reactions/create.contract.js';
import { notesReactionsDeleteContract } from './endpoints/notes/reactions/delete.contract.js';
import { notesRenotesContract } from './endpoints/notes/renotes.contract.js';
import { notesRepliesContract } from './endpoints/notes/replies.contract.js';
import { notesShowContract } from './endpoints/notes/show.contract.js';
import { notesShowPartialBulkContract } from './endpoints/notes/show-partial-bulk.contract.js';
import { notesStateContract } from './endpoints/notes/state.contract.js';
import { notesThreadMutingCreateContract } from './endpoints/notes/thread-muting/create.contract.js';
import { notesThreadMutingDeleteContract } from './endpoints/notes/thread-muting/delete.contract.js';
import { notesTranslateContract } from './endpoints/notes/translate.contract.js';
import { notesUnrenoteContract } from './endpoints/notes/unrenote.contract.js';
import { promoReadContract } from './endpoints/promo/read.contract.js';
import { usersReactionsContract } from './endpoints/users/reactions.contract.js';

export const notesApiContract = {
	delete: notesDeleteContract,
	adminPromoCreate: adminPromoCreateContract,
	iPin: iPinContract,
	iUnpin: iUnpinContract,
	notes: notesContract,
	notesChildren: notesChildrenContract,
	notesConversation: notesConversationContract,
	notesCreate: notesCreateContract,
	notesDraftsList: notesDraftsListContract,
	notesDraftsCreate: notesDraftsCreateContract,
	notesDraftsDelete: notesDraftsDeleteContract,
	notesDraftsUpdate: notesDraftsUpdateContract,
	notesDraftsCount: notesDraftsCountContract,
	notesPollsRecommendation: notesPollsRecommendationContract,
	notesPollsVote: notesPollsVoteContract,
	notesReactions: notesReactionsContract,
	notesReactionsCreate: notesReactionsCreateContract,
	notesReactionsDelete: notesReactionsDeleteContract,
	notesRenotes: notesRenotesContract,
	notesReplies: notesRepliesContract,
	notesShow: notesShowContract,
	notesShowPartialBulk: notesShowPartialBulkContract,
	notesState: notesStateContract,
	notesThreadMutingCreate: notesThreadMutingCreateContract,
	notesThreadMutingDelete: notesThreadMutingDeleteContract,
	notesTranslate: notesTranslateContract,
	notesUnrenote: notesUnrenoteContract,
	promoRead: promoReadContract,
	usersReactions: usersReactionsContract,
};
