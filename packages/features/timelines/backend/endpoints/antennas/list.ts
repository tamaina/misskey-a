/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAntennasListDefinition, packedAntennasListInput, packedAntennasListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedAntennasListDefinition);

export const meta = {
	tags: ['antennas', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAntennasListInput, typeof packedAntennasListOutput> {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private antennaEntityService: AntennaEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const antennas = await this.antennasRepository.findBy({
				userId: me.id,
			});

			return await Promise.all(antennas.map(x => this.antennaEntityService.pack(x)));
		});
	}
}
