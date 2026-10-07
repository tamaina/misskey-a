/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { uniqueAppCreateDefinition, uniqueAppCreateInput, uniqueAppCreateOutput } from '../../../contract/unique-string-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { AppsRepository } from '@/models/_.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { unique } from '@/misc/prelude/array.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(uniqueAppCreateDefinition);

export const meta = {
	tags: ['app'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof uniqueAppCreateInput, typeof uniqueAppCreateOutput> {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Generate secret
			const secret = secureRndstr(32);

			// for backward compatibility
			const permission = unique(ps.permission.map(v => v.replace(/^(.+)(\/|-)(read|write)$/, '$3:$1')));

			// Create account
			const app = await this.appsRepository.insertOne({
				id: this.idService.gen(),
				userId: me ? me.id : null,
				name: ps.name,
				description: ps.description,
				permission,
				callbackUrl: ps.callbackUrl,
				secret: secret,
			});

			return await this.appEntityService.pack(app, null, {
				detail: true,
				includeSecret: true,
			});
		});
	}
}
