/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { timelinesContract } from './endpoints/timelines.contract.js';
import { createAntennasCreateProcedure } from './endpoints/antennas/create.js';
import { createAntennasDeleteProcedure } from './endpoints/antennas/delete.js';
import { createAntennasListProcedure } from './endpoints/antennas/list.js';
import { createAntennasNotesProcedure } from './endpoints/antennas/notes.js';
import { createAntennasRemoveNoteProcedure } from './endpoints/antennas/remove-note.js';
import { createAntennasShowProcedure } from './endpoints/antennas/show.js';
import { createAntennasUpdateProcedure } from './endpoints/antennas/update.js';
import { createNotesGlobalTimelineProcedure } from './endpoints/notes/global-timeline.js';
import { createNotesHybridTimelineProcedure } from './endpoints/notes/hybrid-timeline.js';
import { createNotesLocalTimelineProcedure } from './endpoints/notes/local-timeline.js';
import { createNotesMentionsProcedure } from './endpoints/notes/mentions.js';
import { createNotesTimelineProcedure } from './endpoints/notes/timeline.js';
import { createNotesUserListTimelineProcedure } from './endpoints/notes/user-list-timeline.js';
import { createUsersNotesProcedure } from './endpoints/users/notes.js';
import type { TimelinesContext } from './operations.js';
import type { ApiActor } from '../../api/backend/transport/context.js';

export function createTimelinesRouter<Actor extends ApiActor>() {
	return implement(timelinesContract).$context<TimelinesContext<Actor>>().router({
		antennasCreate: createAntennasCreateProcedure<Actor>(),
		antennasDelete: createAntennasDeleteProcedure<Actor>(),
		antennasList: createAntennasListProcedure<Actor>(),
		antennasNotes: createAntennasNotesProcedure<Actor>(),
		antennasRemoveNote: createAntennasRemoveNoteProcedure<Actor>(),
		antennasShow: createAntennasShowProcedure<Actor>(),
		antennasUpdate: createAntennasUpdateProcedure<Actor>(),
		notesGlobalTimeline: createNotesGlobalTimelineProcedure<Actor>(),
		notesHybridTimeline: createNotesHybridTimelineProcedure<Actor>(),
		notesLocalTimeline: createNotesLocalTimelineProcedure<Actor>(),
		notesMentions: createNotesMentionsProcedure<Actor>(),
		notesTimeline: createNotesTimelineProcedure<Actor>(),
		notesUserListTimeline: createNotesUserListTimelineProcedure<Actor>(),
		usersNotes: createUsersNotesProcedure<Actor>(),
	});
}
