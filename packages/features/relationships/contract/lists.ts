/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { misskeyId } from '../../api/contract/index.js';

const listIdInput = v.looseObject({ listId: misskeyId });
const membershipInput = v.looseObject({ listId: misskeyId, userId: misskeyId });
const updateMembershipInput = v.looseObject({
	listId: misskeyId,
	userId: misskeyId,
	withReplies: v.optional(v.boolean()),
});
const voidOutput = v.void();

/** Route-specific errors preserve the public legacy codes and UUIDs. */
export const listErrors = {
	'users/lists/delete': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '78436795-db79-42f5-b1e2-55ea2cf19166',
		},
	},
	'users/lists/favorite': {
		noSuchList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '7dbaf3cf-7b42-4b8f-b431-b3919e580dbe',
		},
		alreadyFavorited: {
			message: 'The list has already been favorited.',
			code: 'ALREADY_FAVORITED',
			id: '6425bba0-985b-461e-af1b-518070e72081',
		},
	},
	'users/lists/pull': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7f44670e-ab16-43b8-b4c1-ccd2ee89cc02',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '588e7f72-c744-4a61-b180-d354e912bda2',
		},
	},
	'users/lists/push': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '2214501d-ac96-4049-b717-91e42272a711',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a89abd3d-f0bc-4cce-beb1-2f446f4f1e6a',
		},
		alreadyAdded: {
			message: 'That user has already been added to that list.',
			code: 'ALREADY_ADDED',
			id: '1de7c884-1595-49e9-857e-61f12f4d4fc5',
		},
		youHaveBeenBlocked: {
			message: 'You cannot push this user because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '990232c5-3f9d-4d83-9f3f-ef27b6332a4b',
		},
		tooManyUsers: {
			message: 'You can not push users any more.',
			code: 'TOO_MANY_USERS',
			id: '2dd9752e-a338-413d-8eec-41814430989b',
		},
	},
	'users/lists/unfavorite': {
		noSuchList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: 'baedb33e-76b8-4b0c-86a8-9375c0a7b94b',
		},
		notFavorited: {
			message: 'You have not favorited the list.',
			// This misspelled legacy code is part of the public API.
			code: 'ALREADY_FAVORITED',
			id: '835c4b27-463d-4cfa-969b-a9058678d465',
		},
	},
	'users/lists/update-membership': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7f44670e-ab16-43b8-b4c1-ccd2ee89cc02',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '588e7f72-c744-4a61-b180-d354e912bda2',
		},
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

export const listInputs = {
	'users/lists/delete': listIdInput,
	'users/lists/favorite': listIdInput,
	'users/lists/pull': membershipInput,
	'users/lists/push': membershipInput,
	'users/lists/unfavorite': listIdInput,
	'users/lists/update-membership': updateMembershipInput,
};

export const listContract = {
	'users/lists/delete': oc.route({ method: 'POST', path: '/users/lists/delete', tags: ['lists'] })
		.input(listInputs['users/lists/delete']).output(voidOutput),
	'users/lists/favorite': oc.route({ method: 'POST', path: '/users/lists/favorite', tags: ['lists'] })
		.input(listInputs['users/lists/favorite']).output(voidOutput),
	'users/lists/pull': oc.route({ method: 'POST', path: '/users/lists/pull', tags: ['lists', 'users'] })
		.input(listInputs['users/lists/pull']).output(voidOutput),
	'users/lists/push': oc.route({ method: 'POST', path: '/users/lists/push', tags: ['lists', 'users'] })
		.input(listInputs['users/lists/push']).output(voidOutput),
	'users/lists/unfavorite': oc.route({ method: 'POST', path: '/users/lists/unfavorite', tags: ['lists'] })
		.input(listInputs['users/lists/unfavorite']).output(voidOutput),
	'users/lists/update-membership': oc.route({ method: 'POST', path: '/users/lists/update-membership', tags: ['lists', 'users'] })
		.input(listInputs['users/lists/update-membership']).output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof listContract>;
type Outputs = InferContractRouterOutputs<typeof listContract>;
export type ListEndpoints = {
	[K in keyof typeof listContract]: { req: Inputs[K]; res: Outputs[K] };
};
