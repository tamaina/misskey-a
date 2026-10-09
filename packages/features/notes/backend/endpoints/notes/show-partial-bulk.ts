/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesShowPartialBulkContract, notesShowPartialBulkPolicy } from './show-partial-bulk.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesShowPartialBulkDependencies {
	noteEntityService: Pick<NoteEntityService, 'fetchDiffs'>;
}
export function createNotesShowPartialBulkProcedure(deps: NotesShowPartialBulkDependencies) {
	return implement(notesShowPartialBulkContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesShowPartialBulkPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesShowPartialBulkContract['~orpc'].outputSchema), await (async () => {
				return await deps.noteEntityService.fetchDiffs(ps.noteIds, me?.id ?? null);
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
