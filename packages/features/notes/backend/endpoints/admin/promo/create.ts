/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { adminPromoCreateContract, adminPromoCreatePolicy, adminPromoCreateInput, adminPromoCreateOutput, adminPromoCreateErrors } from './create.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../../operations.js';
import type { PromoNotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createAdminPromoCreateProcedure<Actor extends ApiActor>() {
	return implement(adminPromoCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(adminPromoCreatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.adminPromoCreate(input, context.principal));
}

@Injectable()
export class AdminPromoCreateOperation {
	constructor(
		@Inject(DI.promoNotesRepository)
		private promoNotesRepository: PromoNotesRepository,

		private getterService: GetterService,
	) {}
	async execute(ps: v.InferOutput<typeof adminPromoCreateInput>, me: MiLocalUser): Promise<v.InferOutput<typeof adminPromoCreateOutput>> {
		return v.parse(adminPromoCreateOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof adminPromoCreateInput>, _me: MiLocalUser) {
		const note = await this.getterService.getNote(ps.noteId).catch(e => {
			if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(adminPromoCreateErrors.noSuchNote);
			throw e;
		});

		const exist = await this.promoNotesRepository.exists({ where: { noteId: note.id } });

		if (exist) {
			throw apiError(adminPromoCreateErrors.alreadyPromoted);
		}

		await this.promoNotesRepository.insert({
			noteId: note.id,
			expiresAt: new Date(ps.expiresAt),
			userId: note.userId,
		});
	}
}
