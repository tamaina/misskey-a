/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedChatHistoryInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"room": v.optional(v.boolean(), false),
});
export const packedChatHistoryOutput = v.array(packedReference("ChatMessage"));
export const packedChatHistoryDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/history", tags: ["chat"] },
	packedChatHistoryInput,
	packedChatHistoryOutput,
);

export const packedChatMessagesCreateToRoomInput = v.looseObject({
	"text": v.exactOptional(v.nullable(jsonString({ "maxLength": 2000 }))),
	"fileId": v.exactOptional(misskeyId),
	"toRoomId": misskeyId,
});
export const packedChatMessagesCreateToRoomOutput = packedReference("ChatMessageLiteForRoom");
export const packedChatMessagesCreateToRoomDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/messages/create-to-room", tags: ["chat"] },
	packedChatMessagesCreateToRoomInput,
	packedChatMessagesCreateToRoomOutput,
);

export const packedChatMessagesCreateToUserInput = v.looseObject({
	"text": v.exactOptional(v.nullable(jsonString({ "maxLength": 2000 }))),
	"fileId": v.exactOptional(misskeyId),
	"toUserId": misskeyId,
});
export const packedChatMessagesCreateToUserOutput = packedReference("ChatMessageLiteFor1on1");
export const packedChatMessagesCreateToUserDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/messages/create-to-user", tags: ["chat"] },
	packedChatMessagesCreateToUserInput,
	packedChatMessagesCreateToUserOutput,
);

export const packedChatMessagesRoomTimelineInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"roomId": misskeyId,
});
export const packedChatMessagesRoomTimelineOutput = v.array(packedReference("ChatMessageLiteForRoom"));
export const packedChatMessagesRoomTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/messages/room-timeline", tags: ["chat"] },
	packedChatMessagesRoomTimelineInput,
	packedChatMessagesRoomTimelineOutput,
);

export const packedChatMessagesSearchInput = v.looseObject({
	"query": jsonString({ "minLength": 1, "maxLength": 256 }),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"userId": v.exactOptional(v.nullable(misskeyId)),
	"roomId": v.exactOptional(v.nullable(misskeyId)),
});
export const packedChatMessagesSearchOutput = v.array(packedReference("ChatMessage"));
export const packedChatMessagesSearchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/messages/search", tags: ["chat"] },
	packedChatMessagesSearchInput,
	packedChatMessagesSearchOutput,
);

export const packedChatMessagesShowInput = v.looseObject({
	"messageId": misskeyId,
});
export const packedChatMessagesShowOutput = packedReference("ChatMessage");
export const packedChatMessagesShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/messages/show", tags: ["chat"] },
	packedChatMessagesShowInput,
	packedChatMessagesShowOutput,
);

export const packedChatMessagesUserTimelineInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"userId": misskeyId,
});
export const packedChatMessagesUserTimelineOutput = v.array(packedReference("ChatMessageLiteFor1on1"));
export const packedChatMessagesUserTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/messages/user-timeline", tags: ["chat"] },
	packedChatMessagesUserTimelineInput,
	packedChatMessagesUserTimelineOutput,
);

export const packedChatRoomsCreateInput = v.looseObject({
	"name": jsonString({ "maxLength": 256 }),
	"description": v.exactOptional(jsonString({ "maxLength": 1024 })),
});
export const packedChatRoomsCreateOutput = packedReference("ChatRoom");
export const packedChatRoomsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/create", tags: ["chat"] },
	packedChatRoomsCreateInput,
	packedChatRoomsCreateOutput,
);

export const packedChatRoomsInvitationsCreateInput = v.looseObject({
	"roomId": misskeyId,
	"userId": misskeyId,
});
export const packedChatRoomsInvitationsCreateOutput = packedReference("ChatRoomInvitation");
export const packedChatRoomsInvitationsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/invitations/create", tags: ["chat"] },
	packedChatRoomsInvitationsCreateInput,
	packedChatRoomsInvitationsCreateOutput,
);

export const packedChatRoomsInvitationsInboxInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedChatRoomsInvitationsInboxOutput = v.array(packedReference("ChatRoomInvitation"));
export const packedChatRoomsInvitationsInboxDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/invitations/inbox", tags: ["chat"] },
	packedChatRoomsInvitationsInboxInput,
	packedChatRoomsInvitationsInboxOutput,
);

export const packedChatRoomsInvitationsOutboxInput = v.looseObject({
	"roomId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedChatRoomsInvitationsOutboxOutput = v.array(packedReference("ChatRoomInvitation"));
export const packedChatRoomsInvitationsOutboxDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/invitations/outbox", tags: ["chat"] },
	packedChatRoomsInvitationsOutboxInput,
	packedChatRoomsInvitationsOutboxOutput,
);

export const packedChatRoomsJoiningInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedChatRoomsJoiningOutput = v.array(packedReference("ChatRoomMembership"));
export const packedChatRoomsJoiningDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/joining", tags: ["chat"] },
	packedChatRoomsJoiningInput,
	packedChatRoomsJoiningOutput,
);

export const packedChatRoomsMembersInput = v.looseObject({
	"roomId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedChatRoomsMembersOutput = v.array(packedReference("ChatRoomMembership"));
export const packedChatRoomsMembersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/members", tags: ["chat"] },
	packedChatRoomsMembersInput,
	packedChatRoomsMembersOutput,
);

export const packedChatRoomsOwnedInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedChatRoomsOwnedOutput = v.array(packedReference("ChatRoom"));
export const packedChatRoomsOwnedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/owned", tags: ["chat"] },
	packedChatRoomsOwnedInput,
	packedChatRoomsOwnedOutput,
);

export const packedChatRoomsShowInput = v.looseObject({
	"roomId": misskeyId,
});
export const packedChatRoomsShowOutput = packedReference("ChatRoom");
export const packedChatRoomsShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/show", tags: ["chat"] },
	packedChatRoomsShowInput,
	packedChatRoomsShowOutput,
);

export const packedChatRoomsUpdateInput = v.looseObject({
	"roomId": misskeyId,
	"name": v.exactOptional(jsonString({ "maxLength": 256 })),
	"description": v.exactOptional(jsonString({ "maxLength": 1024 })),
});
export const packedChatRoomsUpdateOutput = packedReference("ChatRoom");
export const packedChatRoomsUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/chat/rooms/update", tags: ["chat"] },
	packedChatRoomsUpdateInput,
	packedChatRoomsUpdateOutput,
);

export const packedEndpointDefinitions = {
	"chat/history": packedChatHistoryDefinition,
	"chat/messages/create-to-room": packedChatMessagesCreateToRoomDefinition,
	"chat/messages/create-to-user": packedChatMessagesCreateToUserDefinition,
	"chat/messages/room-timeline": packedChatMessagesRoomTimelineDefinition,
	"chat/messages/search": packedChatMessagesSearchDefinition,
	"chat/messages/show": packedChatMessagesShowDefinition,
	"chat/messages/user-timeline": packedChatMessagesUserTimelineDefinition,
	"chat/rooms/create": packedChatRoomsCreateDefinition,
	"chat/rooms/invitations/create": packedChatRoomsInvitationsCreateDefinition,
	"chat/rooms/invitations/inbox": packedChatRoomsInvitationsInboxDefinition,
	"chat/rooms/invitations/outbox": packedChatRoomsInvitationsOutboxDefinition,
	"chat/rooms/joining": packedChatRoomsJoiningDefinition,
	"chat/rooms/members": packedChatRoomsMembersDefinition,
	"chat/rooms/owned": packedChatRoomsOwnedDefinition,
	"chat/rooms/show": packedChatRoomsShowDefinition,
	"chat/rooms/update": packedChatRoomsUpdateDefinition,
} as const;

export const packedEndpointContracts = {
	"chat/history": packedChatHistoryDefinition.contract,
	"chat/messages/create-to-room": packedChatMessagesCreateToRoomDefinition.contract,
	"chat/messages/create-to-user": packedChatMessagesCreateToUserDefinition.contract,
	"chat/messages/room-timeline": packedChatMessagesRoomTimelineDefinition.contract,
	"chat/messages/search": packedChatMessagesSearchDefinition.contract,
	"chat/messages/show": packedChatMessagesShowDefinition.contract,
	"chat/messages/user-timeline": packedChatMessagesUserTimelineDefinition.contract,
	"chat/rooms/create": packedChatRoomsCreateDefinition.contract,
	"chat/rooms/invitations/create": packedChatRoomsInvitationsCreateDefinition.contract,
	"chat/rooms/invitations/inbox": packedChatRoomsInvitationsInboxDefinition.contract,
	"chat/rooms/invitations/outbox": packedChatRoomsInvitationsOutboxDefinition.contract,
	"chat/rooms/joining": packedChatRoomsJoiningDefinition.contract,
	"chat/rooms/members": packedChatRoomsMembersDefinition.contract,
	"chat/rooms/owned": packedChatRoomsOwnedDefinition.contract,
	"chat/rooms/show": packedChatRoomsShowDefinition.contract,
	"chat/rooms/update": packedChatRoomsUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
