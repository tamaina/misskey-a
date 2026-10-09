/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatReadAllContract, chatReadAllPolicy } from './read-all.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ChatApiContext } from '../../operations.js';

export function createChatReadAllProcedure<Actor extends ApiActor>() {
	return implement(chatReadAllContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatReadAllPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatReadAll(input, context.principal));
}
