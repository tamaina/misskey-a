/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../../../../api.definition.js';
import type { EmojisDependencies } from '../../../../api.implementation.js';
export function createV2ListProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'customEmojiService' | 'idService' | 'emojiEntityService'>) {
	return implement(emojisContract.v2List, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'v2/admin/emoji/list', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'read:admin:emoji' })).use(requirePrincipal<Actor>())
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
				emojis: await deps.emojiEntityService.packDetailedAdminMany(result.emojis),
				count: result.count, allCount: result.allCount, allPages: result.allPages,
			};
		});
}
