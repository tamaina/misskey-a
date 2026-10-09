/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedRecord } from '../../../../users/backend/json-value.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';

import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesShowPartialBulkContract } from './show-partial-bulk.contract.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesShowPartialBulkDependencies {
	noteEntityService: Pick<NoteEntityService, 'fetchDiffs'>;
}
export function createNotesShowPartialBulkProcedure(deps: NotesShowPartialBulkDependencies) {
	return createApiProcedure<MiLocalUser>()(notesShowPartialBulkContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					return await deps.noteEntityService.fetchDiffs(ps.noteIds, me?.id ?? null);
			})();
			return result.map(note => ({ id: note.id, reactions: toPackedRecord(note.reactions), reactionEmojis: toPackedRecord(note.reactionEmojis) }));
		});
}
