/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { QueryService } from '../services/QueryService.js';
import { NoteEntityService } from '../serializers/NoteEntityService.js';
import { notesContract, notesPolicy } from './notes.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../operations.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';

export function createNotesProcedure<Actor extends ApiActor>() {
	return implement(notesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesPolicy))
		.handler(({ input, context }) => context.operations.notes.notes(input, context.principal));
}

@Injectable()
export class NotesOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<InferSchemaOutput<NonNullable<typeof notesContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('note.visibility = \'public\'')
			.andWhere('note.localOnly = FALSE')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		if (ps.local) {
			query.andWhere('note.userHost IS NULL');
		}

		if (me == null) this.queryService.generateUgcVisibilityQueryForVisitor(query);

		if (ps.reply !== undefined) {
			query.andWhere(ps.reply ? 'note.replyId IS NOT NULL' : 'note.replyId IS NULL');
		}

		if (ps.renote !== undefined) {
			query.andWhere(ps.renote ? 'note.renoteId IS NOT NULL' : 'note.renoteId IS NULL');
		}

		if (ps.withFiles !== undefined) {
			query.andWhere(ps.withFiles ? 'note.fileIds != \'{}\'' : 'note.fileIds = \'{}\'');
		}

		if (ps.poll !== undefined) {
			query.andWhere(ps.poll ? 'note.hasPoll = TRUE' : 'note.hasPoll = FALSE');
		}

		// TODO
		//if (bot != undefined) {
		//	query.isBot = bot;
		//}

		const notes = await query.limit(ps.limit).getMany();

		return await this.noteEntityService.packMany(notes);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
