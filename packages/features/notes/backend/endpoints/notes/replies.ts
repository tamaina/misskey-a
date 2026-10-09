/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesRepliesContract, notesRepliesPolicy } from './replies.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../operations.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createNotesRepliesProcedure<Actor extends ApiActor>() {
	return implement(notesRepliesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesRepliesPolicy))
		.handler(({ input, context }) => context.operations.notes.notesReplies(input, context.principal));
}

@Injectable()
export class NotesRepliesOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesRepliesContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<InferSchemaOutput<NonNullable<typeof notesRepliesContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesRepliesContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesRepliesContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('note.replyId = :replyId', { replyId: ps.noteId })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);

		const timeline = await query.limit(ps.limit).getMany();

		return await this.noteEntityService.packMany(timeline, me);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
