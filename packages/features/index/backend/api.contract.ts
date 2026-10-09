/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instanceApiContract } from '../../instance/backend/api.contract.js';
import { statisticsContract } from '../../statistics/backend/endpoints/statistics.contract.js';
import { discoveryContract } from '../../discovery/backend/endpoints/discovery.contract.js';
import { announcementsContract } from '../../announcements/backend/api.contract.js';
import { avatarDecorationsContract } from '../../avatar-decorations/backend/api.contract.js';
import { emojisContract } from '../../emojis/backend/api.contract.js';
import { notificationsContract } from '../../notifications/backend/endpoints/notifications.contract.js';
import { preferencesContract } from '../../preferences/backend/api.contract.js';
import { notesApiContract } from '../../notes/backend/api.contract.js';
import { drivePilotContract } from '../../drive/backend/endpoints/drive/files/create.contract.js';

import { usersContract } from '../../users/backend/api.contract.js';

import { timelinesContract } from '../../timelines/backend/endpoints/timelines.contract.js';

import { noteSearchContract } from '../../note-search/backend/endpoints/noteSearch.contract.js';

import { relationshipsContract } from '../../relationships/backend/endpoints/relationships.contract.js';

import { collectionsContract } from '../../collections/backend/api.contract.js';

export const pilotContract: {
	instance: typeof instanceApiContract;
	statistics: typeof statisticsContract;
	discovery: typeof discoveryContract;
	announcements: typeof announcementsContract;
	avatarDecorations: typeof avatarDecorationsContract;
	preferences: typeof preferencesContract;
	emojis: typeof emojisContract;
	notifications: typeof notificationsContract;
	notes: typeof notesApiContract;
	users: typeof usersContract;
	timelines: typeof timelinesContract;
	noteSearch: typeof noteSearchContract;
	relationships: typeof relationshipsContract;
	collections: typeof collectionsContract;
	drive: typeof drivePilotContract;
} = {
	instance: instanceApiContract,
	statistics: statisticsContract,
	discovery: discoveryContract,
	announcements: announcementsContract,
	avatarDecorations: avatarDecorationsContract,
	preferences: preferencesContract,
	emojis: emojisContract,
	notifications: notificationsContract,
	notes: notesApiContract,
	users: usersContract,
	timelines: timelinesContract,
	noteSearch: noteSearchContract,
	relationships: relationshipsContract,
	collections: collectionsContract,
	drive: drivePilotContract,
};
