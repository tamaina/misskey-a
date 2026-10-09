/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { antennasCreateInput, antennasCreateOutput } from './endpoints/antennas/create.contract.js';
import type { antennasDeleteInput, antennasDeleteOutput } from './endpoints/antennas/delete.contract.js';
import type { antennasListInput, antennasListOutput } from './endpoints/antennas/list.contract.js';
import type { antennasNotesInput, antennasNotesOutput } from './endpoints/antennas/notes.contract.js';
import type { antennasRemoveNoteInput, antennasRemoveNoteOutput } from './endpoints/antennas/remove-note.contract.js';
import type { antennasShowInput, antennasShowOutput } from './endpoints/antennas/show.contract.js';
import type { antennasUpdateInput, antennasUpdateOutput } from './endpoints/antennas/update.contract.js';
import type { notesGlobalTimelineInput, notesGlobalTimelineOutput } from './endpoints/notes/global-timeline.contract.js';
import type { notesHybridTimelineInput, notesHybridTimelineOutput } from './endpoints/notes/hybrid-timeline.contract.js';
import type { notesLocalTimelineInput, notesLocalTimelineOutput } from './endpoints/notes/local-timeline.contract.js';
import type { notesMentionsInput, notesMentionsOutput } from './endpoints/notes/mentions.contract.js';
import type { notesTimelineInput, notesTimelineOutput } from './endpoints/notes/timeline.contract.js';
import type { notesUserListTimelineInput, notesUserListTimelineOutput } from './endpoints/notes/user-list-timeline.contract.js';
import type { usersNotesInput, usersNotesOutput } from './endpoints/users/notes.contract.js';

export interface TimelinesOperations<Actor extends ApiActor> {
	antennasCreate(input: v.InferOutput<typeof antennasCreateInput>, actor: Actor): Promise<v.InferOutput<typeof antennasCreateOutput>>;
	antennasDelete(input: v.InferOutput<typeof antennasDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof antennasDeleteOutput>>;
	antennasList(input: v.InferOutput<typeof antennasListInput>, actor: Actor): Promise<v.InferOutput<typeof antennasListOutput>>;
	antennasNotes(input: v.InferOutput<typeof antennasNotesInput>, actor: Actor): Promise<v.InferOutput<typeof antennasNotesOutput>>;
	antennasRemoveNote(input: v.InferOutput<typeof antennasRemoveNoteInput>, actor: Actor): Promise<v.InferOutput<typeof antennasRemoveNoteOutput>>;
	antennasShow(input: v.InferOutput<typeof antennasShowInput>, actor: Actor): Promise<v.InferOutput<typeof antennasShowOutput>>;
	antennasUpdate(input: v.InferOutput<typeof antennasUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof antennasUpdateOutput>>;
	notesGlobalTimeline(input: v.InferOutput<typeof notesGlobalTimelineInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesGlobalTimelineOutput>>;
	notesHybridTimeline(input: v.InferOutput<typeof notesHybridTimelineInput>, actor: Actor): Promise<v.InferOutput<typeof notesHybridTimelineOutput>>;
	notesLocalTimeline(input: v.InferOutput<typeof notesLocalTimelineInput>, actor: Actor | null): Promise<v.InferOutput<typeof notesLocalTimelineOutput>>;
	notesMentions(input: v.InferOutput<typeof notesMentionsInput>, actor: Actor): Promise<v.InferOutput<typeof notesMentionsOutput>>;
	notesTimeline(input: v.InferOutput<typeof notesTimelineInput>, actor: Actor): Promise<v.InferOutput<typeof notesTimelineOutput>>;
	notesUserListTimeline(input: v.InferOutput<typeof notesUserListTimelineInput>, actor: Actor): Promise<v.InferOutput<typeof notesUserListTimelineOutput>>;
	usersNotes(input: v.InferOutput<typeof usersNotesInput>, actor: Actor | null): Promise<v.InferOutput<typeof usersNotesOutput>>;
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
