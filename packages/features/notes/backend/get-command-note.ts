/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readErrorId } from './request.schema.js';
import type { ErrorDefinition } from '../../api/backend/transport/orpc-error.js';
import type { NotesCommandDependencies } from './command.dependencies.js';
export async function getCommandNote(deps: Pick<NotesCommandDependencies, 'getNote' | 'createError'>, noteId: string, definition: ErrorDefinition) {
	try { return await deps.getNote(noteId); } catch (error) {
		if (readErrorId(error) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw deps.createError(definition);
		throw error;
	}
}
