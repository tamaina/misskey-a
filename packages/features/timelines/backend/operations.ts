/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { antennasCreateContract } from './endpoints/antennas/create.contract.js';
import type { antennasDeleteContract } from './endpoints/antennas/delete.contract.js';
import type { antennasListContract } from './endpoints/antennas/list.contract.js';
import type { antennasNotesContract } from './endpoints/antennas/notes.contract.js';
import type { antennasRemoveNoteContract } from './endpoints/antennas/remove-note.contract.js';
import type { antennasShowContract } from './endpoints/antennas/show.contract.js';
import type { antennasUpdateContract } from './endpoints/antennas/update.contract.js';
import type { notesGlobalTimelineContract } from './endpoints/notes/global-timeline.contract.js';
import type { notesHybridTimelineContract } from './endpoints/notes/hybrid-timeline.contract.js';
import type { notesLocalTimelineContract } from './endpoints/notes/local-timeline.contract.js';
import type { notesMentionsContract } from './endpoints/notes/mentions.contract.js';
import type { notesTimelineContract } from './endpoints/notes/timeline.contract.js';
import type { notesUserListTimelineContract } from './endpoints/notes/user-list-timeline.contract.js';
import type { usersNotesContract } from './endpoints/users/notes.contract.js';

export interface TimelinesOperations<Actor extends ApiActor> {
	antennasCreate(input: v.InferOutput<NonNullable<typeof antennasCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof antennasCreateContract['~orpc']['outputSchema']>>>;
	antennasDelete(input: v.InferOutput<NonNullable<typeof antennasDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof antennasDeleteContract['~orpc']['outputSchema']>>>;
	antennasList(input: v.InferOutput<NonNullable<typeof antennasListContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof antennasListContract['~orpc']['outputSchema']>>>;
	antennasNotes(input: v.InferOutput<NonNullable<typeof antennasNotesContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof antennasNotesContract['~orpc']['outputSchema']>>>;
	antennasRemoveNote(input: v.InferOutput<NonNullable<typeof antennasRemoveNoteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof antennasRemoveNoteContract['~orpc']['outputSchema']>>>;
	antennasShow(input: v.InferOutput<NonNullable<typeof antennasShowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof antennasShowContract['~orpc']['outputSchema']>>>;
	antennasUpdate(input: v.InferOutput<NonNullable<typeof antennasUpdateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof antennasUpdateContract['~orpc']['outputSchema']>>>;
	notesGlobalTimeline(input: v.InferOutput<NonNullable<typeof notesGlobalTimelineContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof notesGlobalTimelineContract['~orpc']['outputSchema']>>>;
	notesHybridTimeline(input: v.InferOutput<NonNullable<typeof notesHybridTimelineContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof notesHybridTimelineContract['~orpc']['outputSchema']>>>;
	notesLocalTimeline(input: v.InferOutput<NonNullable<typeof notesLocalTimelineContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof notesLocalTimelineContract['~orpc']['outputSchema']>>>;
	notesMentions(input: v.InferOutput<NonNullable<typeof notesMentionsContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof notesMentionsContract['~orpc']['outputSchema']>>>;
	notesTimeline(input: v.InferOutput<NonNullable<typeof notesTimelineContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof notesTimelineContract['~orpc']['outputSchema']>>>;
	notesUserListTimeline(input: v.InferOutput<NonNullable<typeof notesUserListTimelineContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof notesUserListTimelineContract['~orpc']['outputSchema']>>>;
	usersNotes(input: v.InferOutput<NonNullable<typeof usersNotesContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof usersNotesContract['~orpc']['outputSchema']>>>;
}
export type TimelinesContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { timelines: TimelinesOperations<Actor> };
};

export type TimelinesApplications<Actor extends ApiActor> = {
	[K in keyof TimelinesOperations<Actor>]: { execute: TimelinesOperations<Actor>[K] };
};

export function createTimelinesOperations<Actor extends ApiActor>(applications: TimelinesApplications<Actor>): TimelinesOperations<Actor> {
	return {
		antennasCreate: (input, actor) => applications.antennasCreate.execute(input, actor),
		antennasDelete: (input, actor) => applications.antennasDelete.execute(input, actor),
		antennasList: (input, actor) => applications.antennasList.execute(input, actor),
		antennasNotes: (input, actor) => applications.antennasNotes.execute(input, actor),
		antennasRemoveNote: (input, actor) => applications.antennasRemoveNote.execute(input, actor),
		antennasShow: (input, actor) => applications.antennasShow.execute(input, actor),
		antennasUpdate: (input, actor) => applications.antennasUpdate.execute(input, actor),
		notesGlobalTimeline: (input, actor) => applications.notesGlobalTimeline.execute(input, actor),
		notesHybridTimeline: (input, actor) => applications.notesHybridTimeline.execute(input, actor),
		notesLocalTimeline: (input, actor) => applications.notesLocalTimeline.execute(input, actor),
		notesMentions: (input, actor) => applications.notesMentions.execute(input, actor),
		notesTimeline: (input, actor) => applications.notesTimeline.execute(input, actor),
		notesUserListTimeline: (input, actor) => applications.notesUserListTimeline.execute(input, actor),
		usersNotes: (input, actor) => applications.usersNotes.execute(input, actor),
	};
}
