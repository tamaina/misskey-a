/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { createAvatarDecorationDefinition, createAvatarDecorationInput, createAvatarDecorationOutput } from '../../../../contract/index.js';
import { AvatarDecorationService } from '../../../services/AvatarDecorationService.js';
import { IdService } from '../../../../../runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(createAvatarDecorationDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',
	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof createAvatarDecorationInput, typeof createAvatarDecorationOutput> {
	constructor(
		private avatarDecorationService: AvatarDecorationService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const created = await this.avatarDecorationService.create({
				name: ps.name,
				description: ps.description,
				url: ps.url,
				roleIdsThatCanBeUsedThisDecoration: ps.roleIdsThatCanBeUsedThisDecoration,
				category: ps.category,
			}, me);

			return {
				id: created.id,
				createdAt: this.idService.parse(created.id).date.toISOString(),
				updatedAt: null,
				name: created.name,
				description: created.description,
				url: created.url,
				roleIdsThatCanBeUsedThisDecoration: created.roleIdsThatCanBeUsedThisDecoration,
				category: created.category,
			};
		});
	}
}
