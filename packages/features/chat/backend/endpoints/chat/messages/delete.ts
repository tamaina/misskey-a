/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatMessagesDeleteContract, chatMessagesDeletePolicy } from './delete.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ChatApiContext } from '../../../operations.js';

export function createChatMessagesDeleteProcedure<Actor extends ApiActor>() {
	return implement(chatMessagesDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatMessagesDeletePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatMessagesDelete(input, context.principal));
}
