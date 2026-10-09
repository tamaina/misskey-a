/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.definition.js';
import type { EmojisDependencies } from '../../../api.implementation.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';
export function createListRemoteProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'queryService' | 'emojisRepository' | 'utilityService' | 'emojiEntityService'>) {
	return implement(emojisContract.listRemote, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/emoji/list-remote', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'read:admin:emoji' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const query = deps.queryService.makePaginationQuery(deps.emojisRepository.createQueryBuilder('emoji'), input.sinceId, input.untilId, input.sinceDate, input.untilDate);
			if (input.host === null) query.andWhere('emoji.host IS NOT NULL');
			else query.andWhere('emoji.host = :host', { host: deps.utilityService.toPuny(input.host) });
			if (input.query) query.andWhere('emoji.name like :query', { query: '%' + sqlLikeEscape(input.query) + '%' });
			return deps.emojiEntityService.packDetailedMany(await query.orderBy('emoji.id', 'DESC').limit(input.limit).getMany());
		});
}
