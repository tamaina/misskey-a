/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminEmojiListRemoteDefinition, packedAdminEmojiListRemoteInput, packedAdminEmojiListRemoteOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { EmojisRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { EmojiEntityService } from '../../../serializers/EmojiEntityService.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

const contractProjection = projectEndpointContract(packedAdminEmojiListRemoteDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'read:admin:emoji',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminEmojiListRemoteInput, typeof packedAdminEmojiListRemoteOutput> {
	constructor(
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private utilityService: UtilityService,
		private queryService: QueryService,
		private emojiEntityService: EmojiEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const q = this.queryService.makePaginationQuery(this.emojisRepository.createQueryBuilder('emoji'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			if (ps.host == null) {
				q.andWhere('emoji.host IS NOT NULL');
			} else {
				q.andWhere('emoji.host = :host', { host: this.utilityService.toPuny(ps.host) });
			}

			if (ps.query) {
				q.andWhere('emoji.name like :query', { query: '%' + sqlLikeEscape(ps.query) + '%' });
			}

			const emojis = await q
				.orderBy('emoji.id', 'DESC')
				.limit(ps.limit)
				.getMany();

			return this.emojiEntityService.packDetailedMany(emojis);
		});
	}
}
