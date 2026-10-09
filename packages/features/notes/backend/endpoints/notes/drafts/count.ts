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
import { notesDraftsCountContract, notesDraftsCountPolicy } from './count.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../../operations.js';
import type { NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createNotesDraftsCountProcedure<Actor extends ApiActor>() {
	return implement(notesDraftsCountContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesDraftsCountPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesDraftsCount(input, context.principal));
}

@Injectable()
export class NotesDraftsCountOperation {
	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesDraftsCountContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof notesDraftsCountContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesDraftsCountContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(_ps: InferSchemaOutput<NonNullable<typeof notesDraftsCountContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const count = await this.noteDraftsRepository.createQueryBuilder('drafts')
			.where('drafts.userId = :meId', { meId: me.id })
			.getCount();

		return count;
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
