/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { antennasCreateContract } from './antennas/create.contract.js';
import { antennasDeleteContract } from './antennas/delete.contract.js';
import { antennasListContract } from './antennas/list.contract.js';
import { antennasNotesContract } from './antennas/notes.contract.js';
import { antennasRemoveNoteContract } from './antennas/remove-note.contract.js';
import { antennasShowContract } from './antennas/show.contract.js';
import { antennasUpdateContract } from './antennas/update.contract.js';
import { notesGlobalTimelineContract } from './notes/global-timeline.contract.js';
import { notesHybridTimelineContract } from './notes/hybrid-timeline.contract.js';
import { notesLocalTimelineContract } from './notes/local-timeline.contract.js';
import { notesMentionsContract } from './notes/mentions.contract.js';
import { notesTimelineContract } from './notes/timeline.contract.js';
import { notesUserListTimelineContract } from './notes/user-list-timeline.contract.js';
import { usersNotesContract } from './users/notes.contract.js';

export const timelinesContract = {
	antennasCreate: antennasCreateContract,
	antennasDelete: antennasDeleteContract,
	antennasList: antennasListContract,
	antennasNotes: antennasNotesContract,
	antennasRemoveNote: antennasRemoveNoteContract,
	antennasShow: antennasShowContract,
	antennasUpdate: antennasUpdateContract,
	notesGlobalTimeline: notesGlobalTimelineContract,
	notesHybridTimeline: notesHybridTimelineContract,
	notesLocalTimeline: notesLocalTimelineContract,
	notesMentions: notesMentionsContract,
	notesTimeline: notesTimelineContract,
	notesUserListTimeline: notesUserListTimelineContract,
	usersNotes: usersNotesContract,
};
