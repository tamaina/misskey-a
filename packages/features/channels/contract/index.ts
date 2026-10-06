/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { misskeyId } from '../../api/contract/index.js';

const channelIdInput = v.looseObject({ channelId: misskeyId });
const muteCreateInput = v.looseObject({
	channelId: misskeyId,
	expiresAt: v.pipe(
		v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
		v.metadata({ description: 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.' }),
	),
});
const voidOutput = v.void();

/** These definitions retain the route-specific errors exposed by the legacy endpoints. */
export const channelErrors = {
	'channels/follow': {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'c0031718-d573-4e85-928e-10039f1fbb68',
		},
		alreadyFollowing: {
			message: 'You are already following that channel.',
			code: 'ALREADY_FOLLOWING',
			id: '7db31665-651e-40c1-8e6e-28e9ad829a2d',
		},
	},
	'channels/unfollow': {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '19959ee9-0153-4c51-bbd9-a98c49dc59d6',
		},
	},
	'channels/favorite': {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '4938f5f3-6167-4c04-9149-6607b7542861',
		},
	},
	'channels/unfavorite': {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '353c68dd-131a-476c-aa99-88a345e83668',
		},
	},
	'channels/mute/create': {
		noSuchChannel: {
			message: 'No such Channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '7174361e-d58f-31d6-2e7c-6fb830786a3f',
		},
		alreadyMuting: {
			message: 'You are already muting that user.',
			code: 'ALREADY_MUTING_CHANNEL',
			id: '5a251978-769a-da44-3e89-3931e43bb592',
		},
		expiresAtIsPast: {
			message: 'Cannot set past date to "expiresAt".',
			code: 'EXPIRES_AT_IS_PAST',
			id: '42b32236-df2c-a45f-fdbf-def67268f749',
		},
	},
	'channels/mute/delete': {
		noSuchChannel: {
			message: 'No such Channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'e7998769-6e94-d9c2-6b8f-94a527314aba',
		},
		notMuting: {
			message: 'You are not muting that channel.',
			code: 'NOT_MUTING_CHANNEL',
			id: '14d55962-6ea8-d990-1333-d6bef78dc2ab',
		},
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

export const channelInputs = {
	'channels/follow': channelIdInput,
	'channels/unfollow': channelIdInput,
	'channels/favorite': channelIdInput,
	'channels/unfavorite': channelIdInput,
	'channels/mute/create': muteCreateInput,
	'channels/mute/delete': channelIdInput,
};

export const channelContract = {
	'channels/follow': oc.route({ method: 'POST', path: '/channels/follow', tags: ['channels'] })
		.input(channelInputs['channels/follow']).output(voidOutput),
	'channels/unfollow': oc.route({ method: 'POST', path: '/channels/unfollow', tags: ['channels'] })
		.input(channelInputs['channels/unfollow']).output(voidOutput),
	'channels/favorite': oc.route({ method: 'POST', path: '/channels/favorite', tags: ['channels'] })
		.input(channelInputs['channels/favorite']).output(voidOutput),
	'channels/unfavorite': oc.route({ method: 'POST', path: '/channels/unfavorite', tags: ['channels'] })
		.input(channelInputs['channels/unfavorite']).output(voidOutput),
	'channels/mute/create': oc.route({ method: 'POST', path: '/channels/mute/create', tags: ['channels', 'mute'] })
		.input(channelInputs['channels/mute/create']).output(voidOutput),
	'channels/mute/delete': oc.route({ method: 'POST', path: '/channels/mute/delete', tags: ['channels', 'mute'] })
		.input(channelInputs['channels/mute/delete']).output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof channelContract>;
type Outputs = InferContractRouterOutputs<typeof channelContract>;
export type ChannelEndpoints = {
	[K in keyof typeof channelContract]: { req: Inputs[K]; res: Outputs[K] };
};
