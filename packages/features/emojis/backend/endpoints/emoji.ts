/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toEmojiDetailed } from '../emoji-output.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';

import { emojisContract } from '../api.definition.js';
import type { EmojisDependencies } from '../api.implementation.js';
import { IsNull } from 'typeorm';
export function createEmojiProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'emojiEntityService' | 'emojisRepository'>) {
	return createApiProcedure<Actor>()(emojisContract.emoji)
		.handler(async ({ input, context }) => {
			return toEmojiDetailed(await deps.emojiEntityService.packDetailed(await deps.emojisRepository.findOneOrFail({ where: { name: input.name, host: IsNull() } })));
		});
}
