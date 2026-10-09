/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesConversationContract, notesConversationPolicy, notesConversationErrors } from './conversation.contract.js';
import type { MiNote } from '../../models/Note.js';
import type { MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesConversationDependencies {
	notesRepository: NotesRepository;
	serverSettings: MiMeta;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	getterService: Pick<GetterService, 'getNote'>;
}
export function createNotesConversationProcedure(deps: NotesConversationDependencies) {
	return implement(notesConversationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesConversationPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesConversationContract['~orpc'].outputSchema), await (async () => {
				if (me == null && deps.serverSettings.ugcVisibilityForVisitor === 'none') return [];

				const note = await deps.getterService.getNote(ps.noteId).catch((err: unknown) => {
					if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesConversationErrors.noSuchNote);
					throw err;
				});

				const conversation: MiNote[] = [];
				let i = 0;

				const get = async (id: string): Promise<void> => {
					i++;
					const p = await deps.notesRepository.findOneBy({ id });
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

				return await deps.noteEntityService.packMany(conversation, me);
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
