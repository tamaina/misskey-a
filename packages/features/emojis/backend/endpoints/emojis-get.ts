/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { emojisContract } from '../api.contract.js';
import type { EmojisDependencies } from '../api.dependencies.js';
import { IsNull } from 'typeorm';
export function createEmojisGetProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'emojiEntityService' | 'emojisRepository'>) {
	return implement(emojisContract.emojisGet, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'emojis' }))
		.handler(async ({ input, context }) => {
			const packed = await deps.emojiEntityService.packSimpleMany(await deps.emojisRepository.find({ where: { host: IsNull() }, order: { category: 'ASC', name: 'ASC' } }));
			return {
				emojis: packed.map(emoji => {
					const result = { ...emoji };
					if (result.localOnly === undefined) delete result.localOnly;
					if (result.isSensitive === undefined) delete result.isSensitive;
					if (result.roleIdsThatCanBeUsedThisEmojiAsReaction === undefined) delete result.roleIdsThatCanBeUsedThisEmojiAsReaction;
					return result;
				})
			};
		});
}
