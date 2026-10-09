/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../../services/QueryService.js';
import { NoteDraftEntityService } from '../../../serializers/NoteDraftEntityService.js';
import { notesDraftsListContract, notesDraftsListPolicy } from './list.contract.js';
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
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesDraftsListContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof notesDraftsListContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesDraftsListContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesDraftsListContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
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

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
