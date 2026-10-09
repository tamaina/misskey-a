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
import type { StatisticsContext } from './operations.js';
import type { ApiActor } from '../../api/backend/transport/context.js';

export function createStatisticsRouter<Actor extends ApiActor>() {
	return implement(statisticsContract).$context<StatisticsContext<Actor>>().router({
		activeUsers: createActiveUsersProcedure<Actor>(),
		activeUsersGet: createActiveUsersGetProcedure<Actor>(),
		apRequest: createApRequestProcedure<Actor>(),
		apRequestGet: createApRequestGetProcedure<Actor>(),
		drive: createDriveProcedure<Actor>(),
		driveGet: createDriveGetProcedure<Actor>(),
		federation: createFederationProcedure<Actor>(),
		federationGet: createFederationGetProcedure<Actor>(),
		instance: createInstanceProcedure<Actor>(),
		instanceGet: createInstanceGetProcedure<Actor>(),
		notes: createNotesProcedure<Actor>(),
		notesGet: createNotesGetProcedure<Actor>(),
		userDrive: createPerUserDriveProcedure<Actor>(),
		userDriveGet: createPerUserDriveGetProcedure<Actor>(),
		userFollowing: createPerUserFollowingProcedure<Actor>(),
		userFollowingGet: createPerUserFollowingGetProcedure<Actor>(),
		userNotes: createPerUserNotesProcedure<Actor>(),
		userNotesGet: createPerUserNotesGetProcedure<Actor>(),
		userPv: createPerUserPvProcedure<Actor>(),
		userPvGet: createPerUserPvGetProcedure<Actor>(),
		userReactions: createPerUserReactionsProcedure<Actor>(),
		userReactionsGet: createPerUserReactionsGetProcedure<Actor>(),
		users: createUsersProcedure<Actor>(),
		usersGet: createUsersGetProcedure<Actor>(),
		retention: createRetentionProcedure<Actor>(),
		retentionGet: createRetentionGetProcedure<Actor>(),
		stats: createStatsProcedure<Actor>(),
	});
}
