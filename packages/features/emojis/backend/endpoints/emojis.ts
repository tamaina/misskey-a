/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toEmojiSimple } from '../emoji-output.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';

import { emojisContract } from '../api.definition.js';
import type { EmojisDependencies } from '../api.implementation.js';
import { IsNull } from 'typeorm';
export function createEmojisProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'emojiEntityService' | 'emojisRepository'>) {
	return createApiProcedure<Actor>()(emojisContract.emojis)
		.handler(async ({ input, context }) => {
			const packed = await deps.emojiEntityService.packSimpleMany(await deps.emojisRepository.find({ where: { host: IsNull() }, order: { category: 'ASC', name: 'ASC' } }));
			return {
				emojis: packed.map(emoji => {
					const result = toEmojiSimple(emoji);
					if (result.localOnly === undefined) delete result.localOnly;
					if (result.isSensitive === undefined) delete result.isSensitive;
					if (result.roleIdsThatCanBeUsedThisEmojiAsReaction === undefined) delete result.roleIdsThatCanBeUsedThisEmojiAsReaction;
					return result;
				})
			};
		});
}
