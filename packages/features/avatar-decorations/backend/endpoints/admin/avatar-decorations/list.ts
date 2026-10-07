/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { listAvatarDecorationsDefinition, listAvatarDecorationsInput, listAvatarDecorationsOutput } from '../../../../contract/index.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { AvatarDecorationService } from '../../../services/AvatarDecorationService.js';

const contractProjection = projectEndpointContract(listAvatarDecorationsDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageAvatarDecorations',
	kind: 'read:admin:avatar-decorations',
	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof listAvatarDecorationsInput, typeof listAvatarDecorationsOutput> {
	constructor(
		private avatarDecorationService: AvatarDecorationService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const avatarDecorations = await this.avatarDecorationService.getAll(true);

			return avatarDecorations.map(avatarDecoration => ({
				id: avatarDecoration.id,
				createdAt: this.idService.parse(avatarDecoration.id).date.toISOString(),
				updatedAt: avatarDecoration.updatedAt?.toISOString() ?? null,
				name: avatarDecoration.name,
				description: avatarDecoration.description,
				url: avatarDecoration.url,
				roleIdsThatCanBeUsedThisDecoration: avatarDecoration.roleIdsThatCanBeUsedThisDecoration,
				category: avatarDecoration.category,
			}));
		});
	}
}
