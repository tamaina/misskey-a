/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc, type InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { packedUserSchema, packedUserDetailedSchema } from '../../../users/backend/user.schema.js';
import { packedNoteSchema } from '../../../notes/backend/note.schema.js';
import { packedHashtagSchema } from './hashtag.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const packedHashtagsListInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'attachedToUserOnly': v.optional(v.boolean(), false),
	'attachedToLocalUserOnly': v.optional(v.boolean(), false),
	'attachedToRemoteUserOnly': v.optional(v.boolean(), false),
	'sort': v.picklist(['+mentionedUsers', '-mentionedUsers', '+mentionedLocalUsers', '-mentionedLocalUsers', '+mentionedRemoteUsers', '-mentionedRemoteUsers', '+attachedUsers', '-attachedUsers', '+attachedLocalUsers', '-attachedLocalUsers', '+attachedRemoteUsers', '-attachedRemoteUsers']),
});
export const packedHashtagsShowInput = objectInput({
	'tag': v.string(),
});
export const packedHashtagsUsersInput = objectInput({
	'tag': v.string(),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
	'sort': v.picklist(['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt']),
	'state': v.optional(v.picklist(['all', 'alive']), 'all'),
	'origin': v.optional(v.picklist(['combined', 'local', 'remote']), 'local'),
});
export const packedNotesFeaturedInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'untilId': v.exactOptional(misskeyId),
	'channelId': v.exactOptional(v.nullable(misskeyId)),
});
export const packedUsersFeaturedNotesInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'untilId': v.exactOptional(misskeyId),
	'userId': misskeyId,
});
export const packedUsersGetFrequentlyRepliedUsersInput = objectInput({
	'userId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedUsersRecommendationInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
});
export const packedUsersSearchInput = objectInput({
	'query': v.string(),
	'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'origin': v.optional(v.picklist(['local', 'remote', 'combined']), 'combined'),
	'detail': v.optional(v.boolean(), true),
});
export const inlineHashtagsSearchInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'query': v.string(),
	'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
});
export const inlineHashtagsTrendInput = v.optional(objectInput({}), {});
const searchTagCommon = {
	reply: v.optional(v.nullable(v.boolean()), null), renote: v.optional(v.nullable(v.boolean()), null),
	withFiles: v.optional(v.boolean(), false), poll: v.optional(v.nullable(v.boolean()), null),
	sinceId: v.optional(misskeyId), untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(v.number(), v.integer())), untilDate: v.optional(v.pipe(v.number(), v.integer())),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
};
// The first matching selector wins, as in the legacy anyOf parser.
export const allOfNotesSearchByTagInput = v.union([
	objectInput({ tag: v.pipe(v.string(), v.minLength(1)), ...searchTagCommon }),
	objectInput({ query: v.pipe(v.array(v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1))), v.minLength(1)), ...searchTagCommon }),
]);
const usernameHostEntries = {
	username: v.exactOptional(v.nullable(v.string())), host: v.exactOptional(v.nullable(v.string())),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10), detail: v.optional(v.boolean(), true),
};
export const allOfUsersSearchByUsernameAndHostInput = v.pipe(objectInput(usernameHostEntries),
	v.check(input => 'username' in input || 'host' in input, 'Username or host is required.'));

export const hashtagsListContract = oc.$meta<{ requestName: 'hashtags/list' }>({ requestName: 'hashtags/list' }).route({ method: 'POST', path: '/hashtags/list', operationId: 'post___hashtags___list', tags: ['hashtags'] })
	.errors({ ...commonErrors }).input(packedHashtagsListInput).output(v.array(packedHashtagSchema));
export const hashtagsSearchContract = oc.$meta<{ requestName: 'hashtags/search' }>({ requestName: 'hashtags/search' }).route({ method: 'POST', path: '/hashtags/search', operationId: 'post___hashtags___search', tags: ['hashtags'] })
	.errors({ ...commonErrors }).input(inlineHashtagsSearchInput).output(v.array(v.string()));
export const hashtagsShowContract = oc.$meta<{ requestName: 'hashtags/show' }>({ requestName: 'hashtags/show' }).route({ method: 'POST', path: '/hashtags/show', operationId: 'post___hashtags___show', tags: ['hashtags'] })
	.errors({ ...commonErrors, NO_SUCH_HASHTAG: { status: 400, data: apiErrorData } }).input(packedHashtagsShowInput).output(packedHashtagSchema);
export const hashtagsTrendContract = oc.$meta<{ requestName: 'hashtags/trend'; allowGet: true; cacheSec: number }>({ requestName: 'hashtags/trend', allowGet: true, cacheSec: 60 }).route({ method: 'POST', path: '/hashtags/trend', operationId: 'post___hashtags___trend', tags: ['hashtags'] })
	.errors({ ...commonErrors }).input(inlineHashtagsTrendInput).output(v.array(v.strictObject({ tag: v.string(), chart: v.array(v.number()), usersCount: v.number() })));
export const hashtagsTrendGetContract = oc.route({ method: 'GET', path: '/hashtags/trend', operationId: 'get___hashtags___trend', tags: ['hashtags'] }).errors(commonErrors).input(inlineHashtagsTrendInput).output(v.array(v.strictObject({ tag: v.string(), chart: v.array(v.number()), usersCount: v.number() })));
export const hashtagsUsersContract = oc.$meta<{ requestName: 'hashtags/users' }>({ requestName: 'hashtags/users' }).route({ method: 'POST', path: '/hashtags/users', operationId: 'post___hashtags___users', tags: ['hashtags', 'users'] })
	.errors({ ...commonErrors }).input(packedHashtagsUsersInput).output(v.array(packedUserDetailedSchema));
export const notesFeaturedContract = oc.$meta<{ requestName: 'notes/featured'; allowGet: true; cacheSec: number }>({ requestName: 'notes/featured', allowGet: true, cacheSec: 3600 }).route({ method: 'POST', path: '/notes/featured', operationId: 'post___notes___featured', tags: ['notes'] })
	.errors({ ...commonErrors }).input(packedNotesFeaturedInput).output(v.array(packedNoteSchema));
export const notesFeaturedGetContract = oc.route({ method: 'GET', path: '/notes/featured', operationId: 'get___notes___featured', tags: ['notes'] }).errors(commonErrors).input(packedNotesFeaturedInput).output(v.array(packedNoteSchema));
export const notesSearchByTagContract = oc.$meta<{ requestName: 'notes/search-by-tag' }>({ requestName: 'notes/search-by-tag' }).route({ method: 'POST', path: '/notes/search-by-tag', operationId: 'post___notes___search-by-tag', tags: ['notes', 'hashtags'] })
	.errors({ ...commonErrors }).input(allOfNotesSearchByTagInput).output(v.array(packedNoteSchema));
export const usersFeaturedNotesContract = oc.$meta<{ requestName: 'users/featured-notes'; allowGet: true; cacheSec: number }>({ requestName: 'users/featured-notes', allowGet: true, cacheSec: 3600 }).route({ method: 'POST', path: '/users/featured-notes', operationId: 'post___users___featured-notes', tags: ['notes'] })
	.errors({ ...commonErrors }).input(packedUsersFeaturedNotesInput).output(v.array(packedNoteSchema));
export const usersFeaturedNotesGetContract = oc.route({ method: 'GET', path: '/users/featured-notes', operationId: 'get___users___featured-notes', tags: ['notes'] }).errors(commonErrors).input(packedUsersFeaturedNotesInput).output(v.array(packedNoteSchema));
export const usersGetFrequentlyRepliedUsersContract = oc.$meta<{ requestName: 'users/get-frequently-replied-users' }>({ requestName: 'users/get-frequently-replied-users' }).route({ method: 'POST', path: '/users/get-frequently-replied-users', operationId: 'post___users___get-frequently-replied-users', tags: ['users'], description: 'Get a list of other users that the specified user frequently replies to.' })
	.errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(packedUsersGetFrequentlyRepliedUsersInput).output(v.array(v.strictObject({ user: packedUserDetailedSchema, weight: v.number() })));
export const usersRecommendationContract = oc.$meta<{ requestName: 'users/recommendation' }>({ requestName: 'users/recommendation' }).route({ method: 'POST', path: '/users/recommendation', operationId: 'post___users___recommendation', tags: ['users'], description: 'Show users that the authenticated user might be interested to follow.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(packedUsersRecommendationInput).output(v.array(packedUserDetailedSchema));
export const usersSearchContract = oc.$meta<{ requestName: 'users/search' }>({ requestName: 'users/search' }).route({ method: 'POST', path: '/users/search', operationId: 'post___users___search', tags: ['users'], description: 'Search for users.' })
	.errors({ ...commonErrors }).input(packedUsersSearchInput).output(v.array(packedUserSchema));
export const usersSearchByUsernameAndHostContract = oc.$meta<{ requestName: 'users/search-by-username-and-host' }>({ requestName: 'users/search-by-username-and-host' }).route({ method: 'POST', path: '/users/search-by-username-and-host', operationId: 'post___users___search-by-username-and-host', tags: ['users'], description: 'Search for a user by username and/or host.' })
	.errors({ ...commonErrors }).input(allOfUsersSearchByUsernameAndHostInput).output(v.array(packedUserSchema));
export const discoveryContract = {
	'hashtags/list': hashtagsListContract,
	'hashtags/search': hashtagsSearchContract,
	'hashtags/show': hashtagsShowContract,
	'hashtags/trend': hashtagsTrendContract,
	'hashtags/trend:get': hashtagsTrendGetContract,
	'hashtags/users': hashtagsUsersContract,
	'notes/featured': notesFeaturedContract,
	'notes/featured:get': notesFeaturedGetContract,
	'notes/search-by-tag': notesSearchByTagContract,
	'users/featured-notes': usersFeaturedNotesContract,
	'users/featured-notes:get': usersFeaturedNotesGetContract,
	'users/get-frequently-replied-users': usersGetFrequentlyRepliedUsersContract,
	'users/recommendation': usersRecommendationContract,
	'users/search': usersSearchContract,
	'users/search-by-username-and-host': usersSearchByUsernameAndHostContract,
};
export interface DiscoveryInputs {
	'hashtags/list': v.InferOutput<typeof packedHashtagsListInput>;
	'hashtags/search': v.InferOutput<typeof inlineHashtagsSearchInput>;
	'hashtags/show': v.InferOutput<typeof packedHashtagsShowInput>;
	'hashtags/trend': v.InferOutput<typeof inlineHashtagsTrendInput>;
	'hashtags/users': v.InferOutput<typeof packedHashtagsUsersInput>;
	'notes/featured': v.InferOutput<typeof packedNotesFeaturedInput>;
	'notes/search-by-tag': v.InferOutput<typeof allOfNotesSearchByTagInput>;
	'users/featured-notes': v.InferOutput<typeof packedUsersFeaturedNotesInput>;
	'users/get-frequently-replied-users': v.InferOutput<typeof packedUsersGetFrequentlyRepliedUsersInput>;
	'users/recommendation': v.InferOutput<typeof packedUsersRecommendationInput>;
	'users/search': v.InferOutput<typeof packedUsersSearchInput>;
	'users/search-by-username-and-host': v.InferOutput<typeof allOfUsersSearchByUsernameAndHostInput>;
}
export type DiscoveryOutputs = InferContractRouterOutputs<typeof discoveryContract>;
