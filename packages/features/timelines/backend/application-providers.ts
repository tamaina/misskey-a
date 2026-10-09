/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AntennasCreateApplicationService } from './applications/antennas/create.js';
import { AntennasDeleteApplicationService } from './applications/antennas/delete.js';
import { AntennasListApplicationService } from './applications/antennas/list.js';
import { AntennasNotesApplicationService } from './applications/antennas/notes.js';
import { AntennasRemoveNoteApplicationService } from './applications/antennas/remove-note.js';
import { AntennasShowApplicationService } from './applications/antennas/show.js';
import { AntennasUpdateApplicationService } from './applications/antennas/update.js';
import { NotesGlobalTimelineApplicationService } from './applications/notes/global-timeline.js';
import { NotesHybridTimelineApplicationService } from './applications/notes/hybrid-timeline.js';
import { NotesLocalTimelineApplicationService } from './applications/notes/local-timeline.js';
import { NotesMentionsApplicationService } from './applications/notes/mentions.js';
import { NotesTimelineApplicationService } from './applications/notes/timeline.js';
import { NotesUserListTimelineApplicationService } from './applications/notes/user-list-timeline.js';
import { UsersNotesApplicationService } from './applications/users/notes.js';

export const timelinesApplicationProviders = [
	AntennasCreateApplicationService,
	AntennasDeleteApplicationService,
	AntennasListApplicationService,
	AntennasNotesApplicationService,
	AntennasRemoveNoteApplicationService,
	AntennasShowApplicationService,
	AntennasUpdateApplicationService,
	NotesGlobalTimelineApplicationService,
	NotesHybridTimelineApplicationService,
	NotesLocalTimelineApplicationService,
	NotesMentionsApplicationService,
	NotesTimelineApplicationService,
	NotesUserListTimelineApplicationService,
	UsersNotesApplicationService,
];
