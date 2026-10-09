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
import { notesPilotContract } from '../../notes/backend/endpoints/notes/delete.contract.js';
import { drivePilotContract } from '../../drive/backend/endpoints/drive/files/create.contract.js';

export const pilotContract = {
	instance: instanceApiContract,
	statistics: statisticsContract,
	discovery: discoveryContract,
	announcements: announcementsContract,
	avatarDecorations: avatarDecorationsContract,
	preferences: preferencesContract,
	emojis: emojisContract,
	notifications: notificationsContract,
	notes: notesPilotContract,
	drive: drivePilotContract,
};
