/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc, type InferContractRouterOutputs, type InferSchemaOutput } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { packedUserSchema, packedUserDetailedSchema } from '../../../users/backend/user.schema.js';
import { packedNoteSchema } from '../../../notes/backend/note.schema.js';
import { packedHashtagSchema } from './hashtag.schema.js';

function requiredContractSchema<Schema extends v.GenericSchema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing canonical discovery schema');
	return schema;
}

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const searchTagCommon = {
	reply: v.optional(v.nullable(v.boolean()), null), renote: v.optional(v.nullable(v.boolean()), null),
	withFiles: v.optional(v.boolean(), false), poll: v.optional(v.nullable(v.boolean()), null),
	sinceId: v.optional(misskeyId), untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(v.number(), v.integer())), untilDate: v.optional(v.pipe(v.number(), v.integer())),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
};

export const hashtagsListContract = oc.$meta({
	requestName: 'hashtags/list',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/hashtags/list', tags: ['hashtags'] })
	.errors({ ...commonErrors }).input(objectInput({
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'attachedToUserOnly': v.optional(v.boolean(), false),
		'attachedToLocalUserOnly': v.optional(v.boolean(), false),
		'attachedToRemoteUserOnly': v.optional(v.boolean(), false),
		'sort': v.picklist(['+mentionedUsers', '-mentionedUsers', '+mentionedLocalUsers', '-mentionedLocalUsers', '+mentionedRemoteUsers', '-mentionedRemoteUsers', '+attachedUsers', '-attachedUsers', '+attachedLocalUsers', '-attachedLocalUsers', '+attachedRemoteUsers', '-attachedRemoteUsers']),
	})).output(v.array(packedHashtagSchema));
export const hashtagsSearchContract = oc.$meta({
	requestName: 'hashtags/search',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/hashtags/search', tags: ['hashtags'] })
	.errors({ ...commonErrors }).input(objectInput({
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'query': v.string(),
		'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
	})).output(v.array(v.string()));
export const hashtagsShowContract = oc.$meta({
	requestName: 'hashtags/show',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/hashtags/show', tags: ['hashtags'] })
	.errors({ ...commonErrors, NO_SUCH_HASHTAG: { status: 400, data: apiErrorData } }).input(objectInput({
		'tag': v.string(),
	})).output(packedHashtagSchema);
export const hashtagsTrendContract = oc.$meta({
	requestName: 'hashtags/trend',
	allowGet: true,
	cacheSec: 60,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/hashtags/trend', tags: ['hashtags'] })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.array(v.strictObject({ tag: v.string(), chart: v.array(v.number()), usersCount: v.number() })));
export const hashtagsTrendGetContract = oc.$meta({

} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'GET', path: '/hashtags/trend', tags: ['hashtags'] }).errors(commonErrors).input(requiredContractSchema(hashtagsTrendContract['~orpc'].inputSchema)).output(requiredContractSchema(hashtagsTrendContract['~orpc'].outputSchema));
export const hashtagsUsersContract = oc.$meta({
	requestName: 'hashtags/users',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/hashtags/users', tags: ['hashtags', 'users'] })
	.errors({ ...commonErrors }).input(objectInput({
		'tag': v.string(),
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
		'sort': v.picklist(['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt']),
		'state': v.optional(v.picklist(['all', 'alive']), 'all'),
		'origin': v.optional(v.picklist(['combined', 'local', 'remote']), 'local'),
	})).output(v.array(packedUserDetailedSchema));
export const notesFeaturedContract = oc.$meta({
	requestName: 'notes/featured',
	allowGet: true,
	cacheSec: 3600,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/notes/featured', tags: ['notes'] })
	.errors({ ...commonErrors }).input(objectInput({
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'untilId': v.exactOptional(misskeyId),
		'channelId': v.exactOptional(v.nullable(misskeyId)),
	})).output(v.array(packedNoteSchema));
export const notesFeaturedGetContract = oc.$meta({

} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'GET', path: '/notes/featured', tags: ['notes'] }).errors(commonErrors).input(requiredContractSchema(notesFeaturedContract['~orpc'].inputSchema)).output(requiredContractSchema(notesFeaturedContract['~orpc'].outputSchema));
export const notesSearchByTagContract = oc.$meta({
	requestName: 'notes/search-by-tag',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/notes/search-by-tag', tags: ['notes', 'hashtags'] })
	.errors({ ...commonErrors }).input(v.union([
		objectInput({ tag: v.pipe(v.string(), v.minLength(1)), ...searchTagCommon }),
		objectInput({ query: v.pipe(v.array(v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1))), v.minLength(1)), ...searchTagCommon }),
	])).output(v.array(packedNoteSchema));
export const usersFeaturedNotesContract = oc.$meta({
	requestName: 'users/featured-notes',
	allowGet: true,
	cacheSec: 3600,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/users/featured-notes', tags: ['notes'] })
	.errors({ ...commonErrors }).input(objectInput({
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'untilId': v.exactOptional(misskeyId),
		'userId': misskeyId,
	})).output(v.array(packedNoteSchema));
export const usersFeaturedNotesGetContract = oc.$meta({

} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'GET', path: '/users/featured-notes', tags: ['notes'] }).errors(commonErrors).input(requiredContractSchema(usersFeaturedNotesContract['~orpc'].inputSchema)).output(requiredContractSchema(usersFeaturedNotesContract['~orpc'].outputSchema));
export const usersGetFrequentlyRepliedUsersContract = oc.$meta({
	requestName: 'users/get-frequently-replied-users',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/users/get-frequently-replied-users', tags: ['users'], description: 'Get a list of other users that the specified user frequently replies to.' })
	.errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(objectInput({
		'userId': misskeyId,
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	})).output(v.array(v.strictObject({ user: packedUserDetailedSchema, weight: v.number() })));
export const usersRecommendationContract = oc.$meta({
	requestName: 'users/recommendation',
	requireCredential: true,
	kind: 'read:account',
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/users/recommendation', tags: ['users'], description: 'Show users that the authenticated user might be interested to follow.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
	})).output(v.array(packedUserDetailedSchema));
export const usersSearchContract = oc.$meta({
	requestName: 'users/search',
	requiredRolePolicy: 'canSearchUsers',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/users/search', tags: ['users'], description: 'Search for users.' })
	.errors({ ...commonErrors }).input(objectInput({
		'query': v.string(),
		'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'origin': v.optional(v.picklist(['local', 'remote', 'combined']), 'combined'),
		'detail': v.optional(v.boolean(), true),
	})).output(v.array(packedUserSchema));
export const usersSearchByUsernameAndHostContract = oc.$meta({
	requestName: 'users/search-by-username-and-host',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata).route({ method: 'POST', path: '/users/search-by-username-and-host', tags: ['users'], description: 'Search for a user by username and/or host.' })
	.errors({ ...commonErrors }).input(v.pipe(objectInput({
		username: v.exactOptional(v.nullable(v.string())), host: v.exactOptional(v.nullable(v.string())),
		limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10), detail: v.optional(v.boolean(), true),
	}),
		v.check(input => 'username' in input || 'host' in input, 'Username or host is required.'))).output(v.array(packedUserSchema));
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
export type DiscoveryInputs = {
	[Name in Exclude<keyof typeof discoveryContract, `${string}:get`>]: InferSchemaOutput<NonNullable<(typeof discoveryContract)[Name]['~orpc']['inputSchema']>>;
};
export type DiscoveryOutputs = InferContractRouterOutputs<typeof discoveryContract>;
