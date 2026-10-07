/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { uniqueMiauthGenTokenDefinition, uniqueMiauthGenTokenInput, uniqueMiauthGenTokenOutput } from '../../../contract/unique-string-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { AccessTokensRepository } from '@/models/_.js';
import { IdService } from '../../../../runtime/backend/services/IdService.js';
import { NotificationService } from '../../../../notifications/backend/services/NotificationService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(uniqueMiauthGenTokenDefinition);

export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof uniqueMiauthGenTokenInput, typeof uniqueMiauthGenTokenOutput> {
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
		private notificationService: NotificationService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Generate access token
			const accessToken = secureRndstr(32);

			const now = new Date();

			// Insert access token doc
			await this.accessTokensRepository.insert({
				id: this.idService.gen(now.getTime()),
				lastUsedAt: now,
				session: ps.session,
				userId: me.id,
				token: accessToken,
				hash: accessToken,
				name: ps.name,
				description: ps.description,
				iconUrl: ps.iconUrl,
				permission: ps.permission,
			});

			// アクセストークンが生成されたことを通知
			this.notificationService.createNotification(me.id, 'createToken', {});

			return {
				token: accessToken,
			};
		});
	}
}
