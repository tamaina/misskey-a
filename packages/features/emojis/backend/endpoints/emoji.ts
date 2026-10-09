/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../api.definition.js';
import type { EmojisDependencies } from '../api.implementation.js';
import { IsNull } from 'typeorm';
export function createEmojiProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'emojiEntityService' | 'emojisRepository'>) {
	return implement(emojisContract.emoji, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'emoji' }))
		.handler(async ({ input, context }) => {
			return deps.emojiEntityService.packDetailed(await deps.emojisRepository.findOneOrFail({ where: { name: input.name, host: IsNull() } }));
		});
}
