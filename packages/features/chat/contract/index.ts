/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { misskeyId, objectParams } from '../../api/contract/index.js';

const roomIdInput = v.object({ roomId: misskeyId });
const messageIdInput = v.object({ messageId: misskeyId });
const reactionInput = v.object({ messageId: misskeyId, reaction: v.string() });
const voidOutput = v.void();

/** Route-specific errors stay in the portable contract and retain legacy UUIDs. */
export const chatErrors = {
	'chat/rooms/join': {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '84416476-5ce8-4a2c-b568-9569f1b10733',
		},
	},
	'chat/rooms/leave': {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'cb7f3179-50e8-4389-8c30-dbe2650a67c9',
		},
	},
	'chat/rooms/mute': {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'c2cde4eb-8d0f-42f1-8f2f-c4d6bfc8e5df',
		},
	},
	'chat/rooms/delete': {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'd4e3753d-97bf-4a19-ab8e-21080fbc0f4b',
		},
	},
	'chat/rooms/invitations/ignore': {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '5130557e-5a11-4cfb-9cc5-fe60cda5de0d',
		},
	},
	'chat/messages/react': {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '9b5839b9-0ba0-4351-8c35-37082093d200',
		},
	},
	'chat/messages/unreact': {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: 'c39ea42f-e3ca-428a-ad57-390e0a711595',
		},
	},
	'chat/messages/delete': {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '36b67f0e-66a6-414b-83df-992a55294f17',
		},
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

export const chatInputs = {
	'chat/read-all': objectParams,
	'chat/rooms/join': roomIdInput,
	'chat/rooms/leave': roomIdInput,
	'chat/rooms/mute': v.object({ roomId: misskeyId, mute: v.boolean() }),
	'chat/rooms/delete': roomIdInput,
	'chat/rooms/invitations/ignore': roomIdInput,
	'chat/messages/react': reactionInput,
	'chat/messages/unreact': reactionInput,
	'chat/messages/delete': messageIdInput,
};

export const chatContract = {
	'chat/read-all': oc.route({ method: 'POST', path: '/chat/read-all', tags: ['chat'] })
		.input(chatInputs['chat/read-all'])
		.output(voidOutput),
	'chat/rooms/join': oc.route({ method: 'POST', path: '/chat/rooms/join', tags: ['chat'] })
		.input(chatInputs['chat/rooms/join'])
		.output(voidOutput),
	'chat/rooms/leave': oc.route({ method: 'POST', path: '/chat/rooms/leave', tags: ['chat'] })
		.input(chatInputs['chat/rooms/leave'])
		.output(voidOutput),
	'chat/rooms/mute': oc.route({ method: 'POST', path: '/chat/rooms/mute', tags: ['chat'] })
		.input(chatInputs['chat/rooms/mute'])
		.output(voidOutput),
	'chat/rooms/delete': oc.route({ method: 'POST', path: '/chat/rooms/delete', tags: ['chat'] })
		.input(chatInputs['chat/rooms/delete'])
		.output(voidOutput),
	'chat/rooms/invitations/ignore': oc.route({ method: 'POST', path: '/chat/rooms/invitations/ignore', tags: ['chat'] })
		.input(chatInputs['chat/rooms/invitations/ignore'])
		.output(voidOutput),
	'chat/messages/react': oc.route({ method: 'POST', path: '/chat/messages/react', tags: ['chat'] })
		.input(chatInputs['chat/messages/react'])
		.output(voidOutput),
	'chat/messages/unreact': oc.route({ method: 'POST', path: '/chat/messages/unreact', tags: ['chat'] })
		.input(chatInputs['chat/messages/unreact'])
		.output(voidOutput),
	'chat/messages/delete': oc.route({ method: 'POST', path: '/chat/messages/delete', tags: ['chat'] })
		.input(chatInputs['chat/messages/delete'])
		.output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof chatContract>;
type Outputs = InferContractRouterOutputs<typeof chatContract>;
export type ChatEndpoints = {
	[K in keyof typeof chatContract]: { req: Inputs[K]; res: Outputs[K] };
};
