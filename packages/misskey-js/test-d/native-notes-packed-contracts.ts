/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import type * as v from 'valibot';
import type { packedEndpointDefinitions } from '../built/contracts/notes/contract/packed-endpoint-definitions.js';
import type { Endpoints } from '../built/api.types.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type Request0 = Assert<Equal<Endpoints['i/pin']['req'], v.InferInput<(typeof packedEndpointDefinitions)['i/pin']['input']>>>;
type Response0 = Assert<Equal<Endpoints['i/pin']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['i/pin']['output']>>>;
type Request1 = Assert<Equal<Endpoints['i/unpin']['req'], v.InferInput<(typeof packedEndpointDefinitions)['i/unpin']['input']>>>;
type Response1 = Assert<Equal<Endpoints['i/unpin']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['i/unpin']['output']>>>;
type Request2 = Assert<Equal<Endpoints['notes']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes']['input']>>>;
type Response2 = Assert<Equal<Endpoints['notes']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes']['output']>>>;
type Request3 = Assert<Equal<Endpoints['notes/children']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/children']['input']>>>;
type Response3 = Assert<Equal<Endpoints['notes/children']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/children']['output']>>>;
type Request4 = Assert<Equal<Endpoints['notes/conversation']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/conversation']['input']>>>;
type Response4 = Assert<Equal<Endpoints['notes/conversation']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/conversation']['output']>>>;
type Request5 = Assert<Equal<Endpoints['notes/drafts/list']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/drafts/list']['input']>>>;
type Response5 = Assert<Equal<Endpoints['notes/drafts/list']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/drafts/list']['output']>>>;
type Request6 = Assert<Equal<Endpoints['notes/polls/recommendation']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/polls/recommendation']['input']>>>;
type Response6 = Assert<Equal<Endpoints['notes/polls/recommendation']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/polls/recommendation']['output']>>>;
type Request7 = Assert<Equal<Endpoints['notes/reactions']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/reactions']['input']>>>;
type Response7 = Assert<Equal<Endpoints['notes/reactions']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/reactions']['output']>>>;
type Request8 = Assert<Equal<Endpoints['notes/renotes']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/renotes']['input']>>>;
type Response8 = Assert<Equal<Endpoints['notes/renotes']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/renotes']['output']>>>;
type Request9 = Assert<Equal<Endpoints['notes/replies']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/replies']['input']>>>;
type Response9 = Assert<Equal<Endpoints['notes/replies']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/replies']['output']>>>;
type Request10 = Assert<Equal<Endpoints['notes/show']['req'], v.InferInput<(typeof packedEndpointDefinitions)['notes/show']['input']>>>;
type Response10 = Assert<Equal<Endpoints['notes/show']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['notes/show']['output']>>>;
type Request11 = Assert<Equal<Endpoints['users/reactions']['req'], v.InferInput<(typeof packedEndpointDefinitions)['users/reactions']['input']>>>;
type Response11 = Assert<Equal<Endpoints['users/reactions']['res'], v.InferOutput<(typeof packedEndpointDefinitions)['users/reactions']['output']>>>;

type CoveredRoutes = 'i/pin' | 'i/unpin' | 'notes' | 'notes/children' | 'notes/conversation' | 'notes/drafts/list' | 'notes/polls/recommendation' | 'notes/reactions' | 'notes/renotes' | 'notes/replies' | 'notes/show' | 'users/reactions';
type Coverage = Assert<Equal<CoveredRoutes, keyof typeof packedEndpointDefinitions>>;

export type Cases = [Coverage, Request0, Response0, Request1, Response1, Request2, Response2, Request3, Response3, Request4, Response4, Request5, Response5, Request6, Response6, Request7, Response7, Request8, Response8, Request9, Response9, Request10, Response10, Request11, Response11];
