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
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesConversationContract, notesConversationPolicy, notesConversationErrors } from './conversation.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../operations.js';
import type { MiNote } from '../../models/Note.js';
import type { MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createNotesConversationProcedure<Actor extends ApiActor>() {
	return implement(notesConversationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesConversationPolicy))
		.handler(({ input, context }) => context.operations.notes.notesConversation(input, context.principal));
}

@Injectable()
export class NotesConversationOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesConversationContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<InferSchemaOutput<NonNullable<typeof notesConversationContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesConversationContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesConversationContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		if (me == null && this.serverSettings.ugcVisibilityForVisitor === 'none') return [];

		const note = await this.getterService.getNote(ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesConversationErrors.noSuchNote);
			throw err;
		});

		const conversation: MiNote[] = [];
		let i = 0;

		const get = async (id: string): Promise<void> => {
			i++;
			const p = await this.notesRepository.findOneBy({ id });
			if (p == null) return;

			if (i > ps.offset) {
				conversation.push(p);
			}

			if (conversation.length === ps.limit) {
				return;
			}

			if (p.replyId) {
				await get(p.replyId);
			}
		};

		if (note.replyId) {
			await get(note.replyId);
		}

		return await this.noteEntityService.packMany(conversation, me);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
