/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instanceApiContract } from '../../instance/backend/api.contract.js';
import { statisticsContract } from '../../statistics/backend/endpoints/statistics.contract.js';
import { discoveryContract } from '../../discovery/backend/endpoints/discovery.contract.js';
import { announcementsContract } from '../../announcements/backend/api.contract.js';
import { avatarDecorationsContract } from '../../avatar-decorations/backend/api.definition.js';
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

import { chatApiContract } from '../../chat/backend/api.contract.js';

import { channelsApiContract } from '../../channels/backend/api.contract.js';

import { pagesContract } from '../../pages/backend/endpoints/pages.contract.js';

import { playContract } from '../../play/backend/endpoints/play.contract.js';

import { gamesContract } from '../../games/backend/endpoints/games.contract.js';

import { federationContract } from '../../federation/backend/api.contract.js';

import { operationsApiContract } from '../../operations/backend/api.contract.js';

import { integrationsContract } from '../../integrations/backend/api.contract.js';

import { testContract } from '../../api/backend/endpoints/test.contract.js';

import { driveManagementContract } from '../../drive/backend/management.contract.js';

import { portabilityApiContract } from '../../portability/backend/api.contract.js';

import { authContract } from '../../auth/backend/api.contract.js';

import { moderationContract } from '../../moderation/backend/api.contract.js';

import { rolesContract } from '../../roles/backend/api.contract.js';

import { clearBrowserCacheContract, clearBrowserCacheGetContract } from '../../api/backend/endpoints/clear-browser-cache.contract.js';

export const pilotContract: {
	clearBrowserCache: typeof clearBrowserCacheContract;
	clearBrowserCacheGet: typeof clearBrowserCacheGetContract;
	chat: typeof chatApiContract;
	channels: typeof channelsApiContract;
	pages: typeof pagesContract;
	play: typeof playContract;
	games: typeof gamesContract;
	federation: typeof federationContract;
	operations: typeof operationsApiContract;
	integrations: typeof integrationsContract;
	test: typeof testContract;
	driveManagement: typeof driveManagementContract;
	portability: typeof portabilityApiContract;
	auth: typeof authContract;
	moderation: typeof moderationContract;
	roles: typeof rolesContract;
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
	clearBrowserCache: clearBrowserCacheContract,
	clearBrowserCacheGet: clearBrowserCacheGetContract,
	chat: chatApiContract,
	channels: channelsApiContract,
	pages: pagesContract,
	play: playContract,
	games: gamesContract,
	federation: federationContract,
	operations: operationsApiContract,
	integrations: integrationsContract,
	test: testContract,
	driveManagement: driveManagementContract,
	portability: portabilityApiContract,
	auth: authContract,
	moderation: moderationContract,
	roles: rolesContract,
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
