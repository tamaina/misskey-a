/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineAuthSessionGenerateDefinition, inlineAuthSessionGenerateInput, inlineAuthSessionGenerateOutput } from '../../../../contract/endpoint-definitions.js';
import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';

import type { AppsRepository, AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(inlineAuthSessionGenerateDefinition);

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: '92f93e63-428e-4f2f-a5a4-39e1407fe998',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAuthSessionGenerateInput, typeof inlineAuthSessionGenerateOutput> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Lookup app
			const app = await this.appsRepository.findOneBy({
				secret: ps.appSecret,
			});

			if (app == null) {
				throw new ApiError(meta.errors.noSuchApp);
			}

			// Generate token
			const token = randomUUID();

			// Create session token document
			const doc = await this.authSessionsRepository.insertOne({
				id: this.idService.gen(),
				appId: app.id,
				token: token,
			});

			return {
				token: doc.token,
				url: `${this.config.authUrl}/${doc.token}`,
			};
		});
	}
}
