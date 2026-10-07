/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminPromoCreateDefinition, voidAdminPromoCreateInput, voidAdminPromoCreateOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { PromoNotesRepository } from '@features/persistence/backend/repositories/models.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidAdminPromoCreateDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:promo',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'ee449fbe-af2a-453b-9cae-cf2fe7c895fc',
		},

		alreadyPromoted: {
			message: 'The note has already promoted.',
			code: 'ALREADY_PROMOTED',
			id: 'ae427aa2-7a41-484f-a18c-2c1104051604',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminPromoCreateInput, typeof voidAdminPromoCreateOutput> {
	constructor(
		@Inject(DI.promoNotesRepository)
		private promoNotesRepository: PromoNotesRepository,

		private getterService: GetterService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw e;
			});

			const exist = await this.promoNotesRepository.exists({ where: { noteId: note.id } });

			if (exist) {
				throw new ApiError(meta.errors.alreadyPromoted);
			}

			await this.promoNotesRepository.insert({
				noteId: note.id,
				expiresAt: new Date(ps.expiresAt),
				userId: note.userId,
			});
		});
	}
}
