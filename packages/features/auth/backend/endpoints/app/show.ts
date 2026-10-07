/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAppShowDefinition, packedAppShowInput, packedAppShowOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedAppShowDefinition);

export const meta = {
	tags: ['app'],

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAppShowInput, typeof packedAppShowOutput> {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
	) {
		super(meta, contractProjection, async (ps, user, token) => {
			const isSecure = user != null && token == null;

			// Lookup app
			const ap = await this.appsRepository.findOneBy({ id: ps.appId });

			if (ap == null) {
				throw new ApiError(meta.errors.noSuchApp);
			}

			return await this.appEntityService.pack(ap, user, {
				detail: true,
				includeSecret: isSecure && (ap.userId === user!.id),
			});
		});
	}
}
