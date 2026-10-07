/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminEmojiListDefinition, packedAdminEmojiListInput, packedAdminEmojiListOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { EmojisRepository } from '@/models/_.js';
import type { MiEmoji } from '../../../models/Emoji.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { EmojiEntityService } from '../../../serializers/EmojiEntityService.js';
//import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

const contractProjection = projectEndpointContract(packedAdminEmojiListDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'read:admin:emoji',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminEmojiListInput, typeof packedAdminEmojiListOutput> {
	constructor(
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private emojiEntityService: EmojiEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const q = this.queryService.makePaginationQuery(this.emojisRepository.createQueryBuilder('emoji'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('emoji.host IS NULL');

			let emojis: MiEmoji[];

			if (ps.query) {
				//q.andWhere('emoji.name ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` });
				//const emojis = await q.limit(ps.limit).getMany();

				emojis = await q.getMany();
				const queryarry = ps.query.match(/\:([a-z0-9_]*)\:/g);

				if (queryarry) {
					emojis = emojis.filter(emoji =>
						queryarry.includes(`:${emoji.name}:`),
					);
				} else {
					emojis = emojis.filter(emoji =>
						emoji.name.includes(ps.query!) ||
						emoji.aliases.some(a => a.includes(ps.query!)) ||
						emoji.category?.includes(ps.query!));
				}
				emojis.splice(ps.limit + 1);
			} else {
				emojis = await q.limit(ps.limit).getMany();
			}

			return this.emojiEntityService.packDetailedMany(emojis);
		});
	}
}
