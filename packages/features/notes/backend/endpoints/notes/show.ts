/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { MiMeta } from '@features/instance/backend/models/Meta.js';
import * as v from 'valibot';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesShowContract, notesShowPolicy, notesShowErrors } from './show.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesShowDependencies {
	serverSettings: MiMeta;
	noteEntityService: Pick<NoteEntityService, 'pack'>;
	getterService: Pick<GetterService, 'getNoteWithRelations'>;
}
export function createNotesShowProcedure(deps: NotesShowDependencies) {
	return implement(notesShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesShowPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesShowContract['~orpc'].outputSchema), await (async () => {
				const note = await deps.getterService.getNoteWithRelations(ps.noteId).catch((err: unknown) => {
					if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesShowErrors.noSuchNote);
					throw err;
				});

				if (note.user!.requireSigninToViewContents && me == null) {
					throw apiError(notesShowErrors.contentRestrictedByUser);
				}

				if (deps.serverSettings.ugcVisibilityForVisitor === 'none' && me == null) {
					throw apiError(notesShowErrors.contentRestrictedByServer);
				}

				if (deps.serverSettings.ugcVisibilityForVisitor === 'local' && note.userHost != null && me == null) {
					throw apiError(notesShowErrors.contentRestrictedByServer);
				}

				return await deps.noteEntityService.pack(note, me, {
					detail: true,
				});
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
