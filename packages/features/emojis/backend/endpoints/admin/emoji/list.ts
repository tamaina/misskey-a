/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.definition.js';
import type { EmojisDependencies } from '../../../api.implementation.js';
import type { MiEmoji } from '../../../models/Emoji.js';
export function createListProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'queryService' | 'emojisRepository' | 'emojiEntityService'>) {
	return implement(emojisContract.list, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/emoji/list', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'read:admin:emoji' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const query = deps.queryService.makePaginationQuery(deps.emojisRepository.createQueryBuilder('emoji'), input.sinceId, input.untilId, input.sinceDate, input.untilDate)
				.andWhere('emoji.host IS NULL');
			let rows: MiEmoji[];
			const search = input.query;
			if (search) {
				rows = await query.getMany();
				const names = search.match(/\:([a-z0-9_]*)\:/g);
				rows = names ? rows.filter(row => names.includes(`:${row.name}:`))
					: rows.filter(row => row.name.includes(search) || row.aliases.some(alias => alias.includes(search)) || row.category?.includes(search));
				// The legacy search path deliberately returns limit + 1 rows.
				rows.splice(input.limit + 1);
			} else {
				rows = await query.limit(input.limit).getMany();
			}
			return deps.emojiEntityService.packDetailedMany(rows);
		});
}
