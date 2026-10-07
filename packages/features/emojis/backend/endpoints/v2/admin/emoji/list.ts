/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { portableV2AdminEmojiListDefinition, portableV2AdminEmojiListInput, portableV2AdminEmojiListOutput } from '../../../../../contract/portable-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { EmojiEntityService } from '../../../../serializers/EmojiEntityService.js';
import { CustomEmojiService } from '../../../../services/CustomEmojiService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(portableV2AdminEmojiListDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'read:admin:emoji',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof portableV2AdminEmojiListInput, typeof portableV2AdminEmojiListOutput> {
	constructor(
		private customEmojiService: CustomEmojiService,
		private emojiEntityService: EmojiEntityService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : undefined);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : undefined);

			const q = ps.query;
			const result = await this.customEmojiService.fetchEmojis(
				{
					query: {
						updatedAtFrom: q?.updatedAtFrom,
						updatedAtTo: q?.updatedAtTo,
						name: q?.name,
						host: q?.host,
						uri: q?.uri,
						publicUrl: q?.publicUrl,
						type: q?.type,
						aliases: q?.aliases,
						category: q?.category,
						license: q?.license,
						isSensitive: q?.isSensitive,
						localOnly: q?.localOnly,
						hostType: q?.hostType,
						roleIds: q?.roleIds,
					},
					sinceId: sinceId,
					untilId: untilId,
				},
				{
					limit: ps.limit,
					page: ps.page,
					sortKeys: ps.sortKeys,
				},
			);

			return {
				emojis: await this.emojiEntityService.packDetailedAdminMany(result.emojis),
				count: result.count,
				allCount: result.allCount,
				allPages: result.allPages,
			};
		});
	}
}
