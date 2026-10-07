/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAuthAcceptDefinition, voidAuthAcceptInput, voidAuthAcceptOutput } from '../../../contract/void-endpoint-definitions.js';
import * as crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';

import type { AuthSessionsRepository, AppsRepository, AccessTokensRepository } from '@/models/_.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidAuthAcceptDefinition);

export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '9c72d8de-391a-43c1-9d06-08d29efde8df',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAuthAcceptInput, typeof voidAuthAcceptOutput> {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Fetch token
			const session = await this.authSessionsRepository
				.findOneBy({ token: ps.token });

			if (session == null) {
				throw new ApiError(meta.errors.noSuchSession);
			}

			const accessToken = secureRndstr(32);

			// Fetch exist access token
			const exist = await this.accessTokensRepository.exists({
				where: {
					appId: session.appId,
					userId: me.id,
				},
			});

			if (!exist) {
				const app = await this.appsRepository.findOneByOrFail({ id: session.appId });

				// Generate Hash
				const sha256 = crypto.createHash('sha256');
				sha256.update(accessToken + app.secret);
				const hash = sha256.digest('hex');

				const now = new Date();

				await this.accessTokensRepository.insert({
					id: this.idService.gen(now.getTime()),
					lastUsedAt: now,
					appId: session.appId,
					userId: me.id,
					token: accessToken,
					hash: hash,
				});
			}

			// Update session
			await this.authSessionsRepository.update(session.id, {
				userId: me.id,
			});
		});
	}
}
