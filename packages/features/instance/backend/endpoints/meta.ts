/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { unionMetaDefinition } from '../../contract/union-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { LegacyMetaConfigurationProducerEndpoint } from '../legacy-meta-configuration-producer-endpoint.js';
import { MetaEntityService } from '../serializers/MetaEntityService.js';

const contractProjection = projectEndpointContract(unionMetaDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends LegacyMetaConfigurationProducerEndpoint<typeof meta> {
	constructor(
		private metaEntityService: MetaEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return ps.detail ? await this.metaEntityService.packDetailed() : await this.metaEntityService.pack();
		});
	}
}
