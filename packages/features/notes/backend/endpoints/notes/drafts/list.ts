/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../../services/QueryService.js';
import { NoteDraftEntityService } from '../../../serializers/NoteDraftEntityService.js';
import { notesDraftsListContract, notesDraftsListPolicy, notesDraftsListInput, notesDraftsListOutput } from './list.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../../operations.js';
import type { MiNoteDraft, NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createNotesDraftsListProcedure<Actor extends ApiActor>() {
	return implement(notesDraftsListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesDraftsListPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesDraftsList(input, context.principal));
}

@Injectable()
export class NotesDraftsListOperation {
	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		private queryService: QueryService,
		private noteDraftEntityService: NoteDraftEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof notesDraftsListInput>, me: MiLocalUser): Promise<v.InferOutput<typeof notesDraftsListOutput>> {
		return v.parse(notesDraftsListOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof notesDraftsListInput>, me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery<MiNoteDraft>(this.noteDraftsRepository.createQueryBuilder('drafts'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('drafts.userId = :meId', { meId: me.id });

		if (ps.scheduled === true) {
			query.andWhere('drafts.isActuallyScheduled = true');
		} else if (ps.scheduled === false) {
			query.andWhere('drafts.isActuallyScheduled = false');
		}

		const drafts = await query
			.limit(ps.limit)
			.getMany();

		return await this.noteDraftEntityService.packMany(drafts, me);
	}
}
