/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toEmojiDetailedAdmin } from '../../../../emoji-output.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../../../../api.definition.js';
import type { EmojisDependencies } from '../../../../api.implementation.js';
export function createV2ListProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'customEmojiService' | 'idService' | 'emojiEntityService'>) {
	return createApiProcedure<Actor>()(emojisContract.v2List).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const q = input.query;
			const result = await deps.customEmojiService.fetchEmojis({
				query: {
					updatedAtFrom: q?.updatedAtFrom, updatedAtTo: q?.updatedAtTo, name: q?.name, host: q?.host,
					uri: q?.uri, publicUrl: q?.publicUrl, type: q?.type, aliases: q?.aliases, category: q?.category,
					license: q?.license, isSensitive: q?.isSensitive, localOnly: q?.localOnly, hostType: q?.hostType, roleIds: q?.roleIds,
				},
				sinceId: input.sinceId ?? (input.sinceDate ? deps.idService.gen(input.sinceDate) : undefined),
				untilId: input.untilId ?? (input.untilDate ? deps.idService.gen(input.untilDate) : undefined),
			}, { limit: input.limit, page: input.page, sortKeys: input.sortKeys });
			return {
				emojis: (await deps.emojiEntityService.packDetailedAdminMany(result.emojis)).map(toEmojiDetailedAdmin),
				count: result.count, allCount: result.allCount, allPages: result.allPages,
			};
		});
}
