/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { misskeyId } from '../../api/contract/index.js';

const userIdInput = v.object({ userId: misskeyId });
const voidOutput = v.void();

export const relationshipErrors = {
	'following/requests/accept': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '66ce1645-d66c-46bb-8b79-96739af885bd' },
		noFollowRequest: { message: 'No follow request.', code: 'NO_FOLLOW_REQUEST', id: 'bcde4f8b-0913-4614-8881-614e522fb041' },
	},
	'following/requests/reject': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: 'abc2ffa6-25b2-4380-ba99-321ff3a94555' },
	},
	'mute/delete': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: 'b851d00b-8ab1-4a56-8b1b-e24187cb48ef' },
		muteeIsYourself: { message: 'Mutee is yourself.', code: 'MUTEE_IS_YOURSELF', id: 'f428b029-6b39-4d48-a1d2-cc1ae6dd5cf9' },
		notMuting: { message: 'You are not muting that user.', code: 'NOT_MUTING', id: '5467d020-daa9-4553-81e1-135c0c35a96d' },
	},
	'renote-mute/create': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '5e0a5dff-1e94-4202-87ae-4d9c89eb2271' },
		muteeIsYourself: { message: 'Mutee is yourself.', code: 'MUTEE_IS_YOURSELF', id: '37285718-52f7-4aef-b7de-c38b8e8a8420' },
		alreadyMuting: { message: 'You are already muting that user.', code: 'ALREADY_MUTING', id: 'ccfecbe4-1f1c-4fc2-8a3d-c3ffee61cb7b' },
	},
	'renote-mute/delete': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '9b6728cf-638c-4aa1-bedb-e07d8101474d' },
		muteeIsYourself: { message: 'Mutee is yourself.', code: 'MUTEE_IS_YOURSELF', id: '619b1314-0850-4597-a242-e245f3da42af' },
		notMuting: { message: 'You are not muting that user.', code: 'NOT_MUTING', id: '2e4ef874-8bf0-4b4b-b069-4598f6d05817' },
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

export const relationshipInputs = {
	'following/requests/accept': userIdInput,
	'following/requests/reject': userIdInput,
	'mute/delete': userIdInput,
	'renote-mute/create': userIdInput,
	'renote-mute/delete': userIdInput,
};

export const relationshipContract = {
	'following/requests/accept': oc.route({ method: 'POST', path: '/following/requests/accept', tags: ['following', 'account'] })
		.input(relationshipInputs['following/requests/accept']).output(voidOutput),
	'following/requests/reject': oc.route({ method: 'POST', path: '/following/requests/reject', tags: ['following', 'account'] })
		.input(relationshipInputs['following/requests/reject']).output(voidOutput),
	'mute/delete': oc.route({ method: 'POST', path: '/mute/delete', tags: ['account'] })
		.input(relationshipInputs['mute/delete']).output(voidOutput),
	'renote-mute/create': oc.route({ method: 'POST', path: '/renote-mute/create', tags: ['account'] })
		.input(relationshipInputs['renote-mute/create']).output(voidOutput),
	'renote-mute/delete': oc.route({ method: 'POST', path: '/renote-mute/delete', tags: ['account'] })
		.input(relationshipInputs['renote-mute/delete']).output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof relationshipContract>;
type Outputs = InferContractRouterOutputs<typeof relationshipContract>;
export type RelationshipEndpoints = {
	[K in keyof typeof relationshipContract]: { req: Inputs[K]; res: Outputs[K] };
};
