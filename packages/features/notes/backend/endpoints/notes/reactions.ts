/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { NoteReactionEntityService } from '../../serializers/NoteReactionEntityService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { QueryService } from '../../services/QueryService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesReactionsContract, notesReactionsPolicy, notesReactionsErrors } from './reactions.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../operations.js';
import type { NoteReactionsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createNotesReactionsProcedure<Actor extends ApiActor>() {
	return implement(notesReactionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesReactionsPolicy))
		.handler(({ input, context }) => context.operations.notes.notesReactions(input, context.principal));
}

@Injectable()
export class NotesReactionsOperation {
	constructor(
		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		private noteReactionEntityService: NoteReactionEntityService,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private getterService: GetterService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesReactionsContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<InferSchemaOutput<NonNullable<typeof notesReactionsContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesReactionsContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesReactionsContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const note = await this.getterService.getNote(ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesReactionsErrors.noSuchNote);
			throw err;
		});

		if (!await this.noteEntityService.isVisibleForMe(note, me ? me.id : null)) {
			throw apiError(notesReactionsErrors.noSuchNote);
		}

		const query = this.queryService.makePaginationQuery(this.noteReactionsRepository.createQueryBuilder('reaction'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('reaction.noteId = :noteId', { noteId: note.id })
			.leftJoinAndSelect('reaction.user', 'user')
			.leftJoinAndSelect('reaction.note', 'note');

		if (ps.type) {
			// ローカルリアクションはホスト名が . とされているが
			// DB 上ではそうではないので、必要に応じて変換
			const suffix = '@.:';
			const type = ps.type.endsWith(suffix) ? ps.type.slice(0, ps.type.length - suffix.length) + ':' : ps.type;
			query.andWhere('reaction.reaction = :type', { type });
		}

		const reactions = await query.limit(ps.limit).getMany();

		return await this.noteReactionEntityService.packMany(reactions, me);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
