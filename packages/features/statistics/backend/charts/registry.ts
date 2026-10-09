/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entity as FederationChart } from './definitions/federation.js';
import { entity as NotesChart } from './definitions/notes.js';
import { entity as UsersChart } from './definitions/users.js';
import { entity as ActiveUsersChart } from './definitions/active-users.js';
import { entity as InstanceChart } from './definitions/instance.js';
import { entity as PerUserNotesChart } from './definitions/per-user-notes.js';
import { entity as PerUserPvChart } from './definitions/per-user-pv.js';
import { entity as DriveChart } from './definitions/drive.js';
import { entity as PerUserReactionsChart } from './definitions/per-user-reactions.js';
import { entity as PerUserFollowingChart } from './definitions/per-user-following.js';
import { entity as PerUserDriveChart } from './definitions/per-user-drive.js';
import { entity as ApRequestChart } from './definitions/ap-request.js';

import { entity as TestChart } from './definitions/test.js';
import { entity as TestGroupedChart } from './definitions/test-grouped.js';
import { entity as TestUniqueChart } from './definitions/test-unique.js';
import { entity as TestIntersectionChart } from './definitions/test-intersection.js';

export const entities = [
	FederationChart.hour, FederationChart.day,
	NotesChart.hour, NotesChart.day,
	UsersChart.hour, UsersChart.day,
	ActiveUsersChart.hour, ActiveUsersChart.day,
	InstanceChart.hour, InstanceChart.day,
	PerUserNotesChart.hour, PerUserNotesChart.day,
	PerUserPvChart.hour, PerUserPvChart.day,
	DriveChart.hour, DriveChart.day,
	PerUserReactionsChart.hour, PerUserReactionsChart.day,
	PerUserFollowingChart.hour, PerUserFollowingChart.day,
	PerUserDriveChart.hour, PerUserDriveChart.day,
	ApRequestChart.hour, ApRequestChart.day,

	...(process.env.NODE_ENV === 'test' ? [
		TestChart.hour, TestChart.day,
		TestGroupedChart.hour, TestGroupedChart.day,
		TestUniqueChart.hour, TestUniqueChart.day,
		TestIntersectionChart.hour, TestIntersectionChart.day,
	] : []),
];
