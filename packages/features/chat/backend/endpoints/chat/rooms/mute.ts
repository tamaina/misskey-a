/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatRoomsMuteContract, chatRoomsMutePolicy } from './mute.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ChatApiContext } from '../../../operations.js';

export function createChatRoomsMuteProcedure<Actor extends ApiActor>() {
	return implement(chatRoomsMuteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatRoomsMutePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatRoomsMute(input, context.principal));
}
