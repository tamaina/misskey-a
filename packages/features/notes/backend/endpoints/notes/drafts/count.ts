/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineNotesDraftsCountDefinition, inlineNotesDraftsCountInput, inlineNotesDraftsCountOutput } from '../../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(inlineNotesDraftsCountDefinition);

export const meta = {
	tags: ['notes', 'drafts'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'read:account',

	res: contractProjection.response,

	errors: {
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineNotesDraftsCountInput, typeof inlineNotesDraftsCountOutput> {
	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const count = await this.noteDraftsRepository.createQueryBuilder('drafts')
				.where('drafts.userId = :meId', { meId: me.id })
				.getCount();

			return count;
		});
	}
}
