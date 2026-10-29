/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { chartActiveUsersContract, chartActiveUsersGetContract } from './charts/active-users.contract.js';
import { chartApRequestContract, chartApRequestGetContract } from './charts/ap-request.contract.js';
import { chartDriveContract, chartDriveGetContract } from './charts/drive.contract.js';
import { chartFederationContract, chartFederationGetContract } from './charts/federation.contract.js';
import { chartInstanceContract, chartInstanceGetContract } from './charts/instance.contract.js';
import { chartNotesContract, chartNotesGetContract } from './charts/notes.contract.js';
import { chartPerUserDriveContract, chartPerUserDriveGetContract } from './charts/user/drive.contract.js';
import { chartPerUserFollowingContract, chartPerUserFollowingGetContract } from './charts/user/following.contract.js';
import { chartPerUserNotesContract, chartPerUserNotesGetContract } from './charts/user/notes.contract.js';
import { chartPerUserPvContract, chartPerUserPvGetContract } from './charts/user/pv.contract.js';
import { chartPerUserReactionsContract, chartPerUserReactionsGetContract } from './charts/user/reactions.contract.js';
import { chartUsersContract, chartUsersGetContract } from './charts/users.contract.js';
import { retentionContract, retentionGetContract } from './retention.contract.js';
import { statsContract } from './stats.contract.js';

export const statisticsContract = {
	activeUsers: chartActiveUsersContract,
	activeUsersGet: chartActiveUsersGetContract,
	apRequest: chartApRequestContract,
	apRequestGet: chartApRequestGetContract,
	drive: chartDriveContract,
	driveGet: chartDriveGetContract,
	federation: chartFederationContract,
	federationGet: chartFederationGetContract,
	instance: chartInstanceContract,
	instanceGet: chartInstanceGetContract,
	notes: chartNotesContract,
	notesGet: chartNotesGetContract,
	userDrive: chartPerUserDriveContract,
	userDriveGet: chartPerUserDriveGetContract,
	userFollowing: chartPerUserFollowingContract,
	userFollowingGet: chartPerUserFollowingGetContract,
	userNotes: chartPerUserNotesContract,
	userNotesGet: chartPerUserNotesGetContract,
	userPv: chartPerUserPvContract,
	userPvGet: chartPerUserPvGetContract,
	userReactions: chartPerUserReactionsContract,
	userReactionsGet: chartPerUserReactionsGetContract,
	users: chartUsersContract,
	usersGet: chartUsersGetContract,
	retention: retentionContract,
	retentionGet: retentionGetContract,
	stats: statsContract,
};
