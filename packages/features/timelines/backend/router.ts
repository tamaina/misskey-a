/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { timelinesContract } from './endpoints/timelines.contract.js';
import { createAntennasCreateProcedure, type AntennasCreateDependencies } from './endpoints/antennas/create.js';
import { createAntennasDeleteProcedure, type AntennasDeleteDependencies } from './endpoints/antennas/delete.js';
import { createAntennasListProcedure, type AntennasListDependencies } from './endpoints/antennas/list.js';
import { createAntennasNotesProcedure, type AntennasNotesDependencies } from './endpoints/antennas/notes.js';
import { createAntennasRemoveNoteProcedure, type AntennasRemoveNoteDependencies } from './endpoints/antennas/remove-note.js';
import { createAntennasShowProcedure, type AntennasShowDependencies } from './endpoints/antennas/show.js';
import { createAntennasUpdateProcedure, type AntennasUpdateDependencies } from './endpoints/antennas/update.js';
import { createNotesGlobalTimelineProcedure, type NotesGlobalTimelineDependencies } from './endpoints/notes/global-timeline.js';
import { createNotesHybridTimelineProcedure, type NotesHybridTimelineDependencies } from './endpoints/notes/hybrid-timeline.js';
import { createNotesLocalTimelineProcedure, type NotesLocalTimelineDependencies } from './endpoints/notes/local-timeline.js';
import { createNotesMentionsProcedure, type NotesMentionsDependencies } from './endpoints/notes/mentions.js';
import { createNotesTimelineProcedure, type NotesTimelineDependencies } from './endpoints/notes/timeline.js';
import { createNotesUserListTimelineProcedure, type NotesUserListTimelineDependencies } from './endpoints/notes/user-list-timeline.js';
import { createUsersNotesProcedure, type UsersNotesDependencies } from './endpoints/users/notes.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export type TimelinesDependencies = AntennasCreateDependencies & AntennasDeleteDependencies & AntennasListDependencies & AntennasNotesDependencies & AntennasRemoveNoteDependencies & AntennasShowDependencies & AntennasUpdateDependencies & NotesGlobalTimelineDependencies & NotesHybridTimelineDependencies & NotesLocalTimelineDependencies & NotesMentionsDependencies & NotesTimelineDependencies & NotesUserListTimelineDependencies & UsersNotesDependencies;
export function createTimelinesRouter<Actor extends MiLocalUser>(deps: TimelinesDependencies) {
	return implement(timelinesContract).$context<ApiContext<Actor>>().router({
		antennasCreate: createAntennasCreateProcedure<Actor>(deps),
		antennasDelete: createAntennasDeleteProcedure<Actor>(deps),
		antennasList: createAntennasListProcedure<Actor>(deps),
		antennasNotes: createAntennasNotesProcedure<Actor>(deps),
		antennasRemoveNote: createAntennasRemoveNoteProcedure<Actor>(deps),
		antennasShow: createAntennasShowProcedure<Actor>(deps),
		antennasUpdate: createAntennasUpdateProcedure<Actor>(deps),
		notesGlobalTimeline: createNotesGlobalTimelineProcedure<Actor>(deps),
		notesHybridTimeline: createNotesHybridTimelineProcedure<Actor>(deps),
		notesLocalTimeline: createNotesLocalTimelineProcedure<Actor>(deps),
		notesMentions: createNotesMentionsProcedure<Actor>(deps),
		notesTimeline: createNotesTimelineProcedure<Actor>(deps),
		notesUserListTimeline: createNotesUserListTimelineProcedure<Actor>(deps),
		usersNotes: createUsersNotesProcedure<Actor>(deps),
	});
}
