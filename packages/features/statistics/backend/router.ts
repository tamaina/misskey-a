/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { statisticsContract } from './endpoints/statistics.contract.js';
import { createActiveUsersProcedure, createActiveUsersGetProcedure } from './endpoints/charts/active-users.js';
import { createApRequestProcedure, createApRequestGetProcedure } from './endpoints/charts/ap-request.js';
import { createDriveProcedure, createDriveGetProcedure } from './endpoints/charts/drive.js';
import { createFederationProcedure, createFederationGetProcedure } from './endpoints/charts/federation.js';
import { createInstanceProcedure, createInstanceGetProcedure } from './endpoints/charts/instance.js';
import { createNotesProcedure, createNotesGetProcedure } from './endpoints/charts/notes.js';
import { createPerUserDriveProcedure, createPerUserDriveGetProcedure } from './endpoints/charts/user/drive.js';
import { createPerUserFollowingProcedure, createPerUserFollowingGetProcedure } from './endpoints/charts/user/following.js';
import { createPerUserNotesProcedure, createPerUserNotesGetProcedure } from './endpoints/charts/user/notes.js';
import { createPerUserPvProcedure, createPerUserPvGetProcedure } from './endpoints/charts/user/pv.js';
import { createPerUserReactionsProcedure, createPerUserReactionsGetProcedure } from './endpoints/charts/user/reactions.js';
import { createUsersProcedure, createUsersGetProcedure } from './endpoints/charts/users.js';
import { createRetentionProcedure, createRetentionGetProcedure } from './endpoints/retention.js';
import { createStatsProcedure } from './endpoints/stats.js';
import type { StatisticsDependencies } from './api.dependencies.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
export function createStatisticsRouter<Actor extends ApiActor>(deps: StatisticsDependencies) {
	return implement(statisticsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		activeUsers: createActiveUsersProcedure<Actor>(deps.charts.activeUsers),
		activeUsersGet: createActiveUsersGetProcedure<Actor>(deps.charts.activeUsers),
		apRequest: createApRequestProcedure<Actor>(deps.charts.apRequest),
		apRequestGet: createApRequestGetProcedure<Actor>(deps.charts.apRequest),
		drive: createDriveProcedure<Actor>(deps.charts.drive),
		driveGet: createDriveGetProcedure<Actor>(deps.charts.drive),
		federation: createFederationProcedure<Actor>(deps.charts.federation),
		federationGet: createFederationGetProcedure<Actor>(deps.charts.federation),
		instance: createInstanceProcedure<Actor>(deps.charts.instance),
		instanceGet: createInstanceGetProcedure<Actor>(deps.charts.instance),
		notes: createNotesProcedure<Actor>(deps.charts.notes),
		notesGet: createNotesGetProcedure<Actor>(deps.charts.notes),
		userDrive: createPerUserDriveProcedure<Actor>(deps.charts.userDrive),
		userDriveGet: createPerUserDriveGetProcedure<Actor>(deps.charts.userDrive),
		userFollowing: createPerUserFollowingProcedure<Actor>(deps.charts.userFollowing),
		userFollowingGet: createPerUserFollowingGetProcedure<Actor>(deps.charts.userFollowing),
		userNotes: createPerUserNotesProcedure<Actor>(deps.charts.userNotes),
		userNotesGet: createPerUserNotesGetProcedure<Actor>(deps.charts.userNotes),
		userPv: createPerUserPvProcedure<Actor>(deps.charts.userPv),
		userPvGet: createPerUserPvGetProcedure<Actor>(deps.charts.userPv),
		userReactions: createPerUserReactionsProcedure<Actor>(deps.charts.userReactions),
		userReactionsGet: createPerUserReactionsGetProcedure<Actor>(deps.charts.userReactions),
		users: createUsersProcedure<Actor>(deps.charts.users),
		usersGet: createUsersGetProcedure<Actor>(deps.charts.users),
		retention: createRetentionProcedure<Actor>(deps),
		retentionGet: createRetentionGetProcedure<Actor>(deps),
		stats: createStatsProcedure<Actor>(deps),
	});
}
