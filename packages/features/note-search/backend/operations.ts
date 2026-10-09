/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { notesSearchContract } from './endpoints/notes/search.contract.js';

export interface NoteSearchOperations<Actor extends ApiActor> {
	notesSearch(input: v.InferOutput<NonNullable<typeof notesSearchContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof notesSearchContract['~orpc']['outputSchema']>>>;
}
export type NoteSearchContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { noteSearch: NoteSearchOperations<Actor> };
};

export type NoteSearchApplications<Actor extends ApiActor> = {
	[K in keyof NoteSearchOperations<Actor>]: { execute: NoteSearchOperations<Actor>[K] };
};

export function createNoteSearchOperations<Actor extends ApiActor>(applications: NoteSearchApplications<Actor>): NoteSearchOperations<Actor> {
	return {
		notesSearch: (input, actor) => applications.notesSearch.execute(input, actor),
	};
}
