/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { notesApiContract } from '../built/contracts/notes/backend/api.definition.js';
import type { Endpoints } from '../built/api.types.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type Request0 = Assert<Equal<Endpoints['i/pin']['req'], InferContractRouterInputs<typeof notesApiContract>['iPin']>>;
type Response0 = Assert<Equal<Endpoints['i/pin']['res'], InferContractRouterOutputs<typeof notesApiContract>['iPin']>>;
type Request1 = Assert<Equal<Endpoints['i/unpin']['req'], InferContractRouterInputs<typeof notesApiContract>['iUnpin']>>;
type Response1 = Assert<Equal<Endpoints['i/unpin']['res'], InferContractRouterOutputs<typeof notesApiContract>['iUnpin']>>;
type Request2 = Assert<Equal<Endpoints['notes']['req'], InferContractRouterInputs<typeof notesApiContract>['notes']>>;
type Response2 = Assert<Equal<Endpoints['notes']['res'], InferContractRouterOutputs<typeof notesApiContract>['notes']>>;
type Request3 = Assert<Equal<Endpoints['notes/children']['req'], InferContractRouterInputs<typeof notesApiContract>['notesChildren']>>;
type Response3 = Assert<Equal<Endpoints['notes/children']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesChildren']>>;
type Request4 = Assert<Equal<Endpoints['notes/conversation']['req'], InferContractRouterInputs<typeof notesApiContract>['notesConversation']>>;
type Response4 = Assert<Equal<Endpoints['notes/conversation']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesConversation']>>;
type Request5 = Assert<Equal<Endpoints['notes/drafts/list']['req'], InferContractRouterInputs<typeof notesApiContract>['notesDraftsList']>>;
type Response5 = Assert<Equal<Endpoints['notes/drafts/list']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesDraftsList']>>;
type Request6 = Assert<Equal<Endpoints['notes/polls/recommendation']['req'], InferContractRouterInputs<typeof notesApiContract>['notesPollsRecommendation']>>;
type Response6 = Assert<Equal<Endpoints['notes/polls/recommendation']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesPollsRecommendation']>>;
type Request7 = Assert<Equal<Endpoints['notes/reactions']['req'], InferContractRouterInputs<typeof notesApiContract>['notesReactions']>>;
type Response7 = Assert<Equal<Endpoints['notes/reactions']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesReactions']>>;
type Request8 = Assert<Equal<Endpoints['notes/renotes']['req'], InferContractRouterInputs<typeof notesApiContract>['notesRenotes']>>;
type Response8 = Assert<Equal<Endpoints['notes/renotes']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesRenotes']>>;
type Request9 = Assert<Equal<Endpoints['notes/replies']['req'], InferContractRouterInputs<typeof notesApiContract>['notesReplies']>>;
type Response9 = Assert<Equal<Endpoints['notes/replies']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesReplies']>>;
type Request10 = Assert<Equal<Endpoints['notes/show']['req'], InferContractRouterInputs<typeof notesApiContract>['notesShow']>>;
type Response10 = Assert<Equal<Endpoints['notes/show']['res'], InferContractRouterOutputs<typeof notesApiContract>['notesShow']>>;
type Request11 = Assert<Equal<Endpoints['users/reactions']['req'], InferContractRouterInputs<typeof notesApiContract>['usersReactions']>>;
type Response11 = Assert<Equal<Endpoints['users/reactions']['res'], InferContractRouterOutputs<typeof notesApiContract>['usersReactions']>>;

type NativeRouteNames = {
	'i/pin': typeof notesApiContract['iPin'];
	'i/unpin': typeof notesApiContract['iUnpin'];
	'notes': typeof notesApiContract['notes'];
	'notes/children': typeof notesApiContract['notesChildren'];
	'notes/conversation': typeof notesApiContract['notesConversation'];
	'notes/drafts/list': typeof notesApiContract['notesDraftsList'];
	'notes/polls/recommendation': typeof notesApiContract['notesPollsRecommendation'];
	'notes/reactions': typeof notesApiContract['notesReactions'];
	'notes/renotes': typeof notesApiContract['notesRenotes'];
	'notes/replies': typeof notesApiContract['notesReplies'];
	'notes/show': typeof notesApiContract['notesShow'];
	'users/reactions': typeof notesApiContract['usersReactions'];
};
type CoveredRoutes = 'i/pin' | 'i/unpin' | 'notes' | 'notes/children' | 'notes/conversation' | 'notes/drafts/list' | 'notes/polls/recommendation' | 'notes/reactions' | 'notes/renotes' | 'notes/replies' | 'notes/show' | 'users/reactions';
type Coverage = Assert<Equal<CoveredRoutes, keyof NativeRouteNames>>;

export type Cases = [Coverage, Request0, Response0, Request1, Response1, Request2, Response2, Request3, Response3, Request4, Response4, Request5, Response5, Request6, Response6, Request7, Response7, Request8, Response8, Request9, Response9, Request10, Response10, Request11, Response11];
