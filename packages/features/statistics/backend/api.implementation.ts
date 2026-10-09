/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ActiveUsersChart from './charts/active-users.js';
import ApRequestChart from './charts/ap-request.js';
import DriveChart from './charts/drive.js';
import FederationChart from './charts/federation.js';
import InstanceChart from './charts/instance.js';
import NotesChart from './charts/notes.js';
import PerUserDriveChart from './charts/per-user-drive.js';
import PerUserFollowingChart from './charts/per-user-following.js';
import PerUserNotesChart from './charts/per-user-notes.js';
import PerUserPvChart from './charts/per-user-pv.js';
import PerUserReactionsChart from './charts/per-user-reactions.js';
import UsersChart from './charts/users.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
import { statisticsContract } from './endpoints/statistics.contract.js';
import { implement } from '@orpc/server';
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
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RetentionAggregationsRepository, NoteReactionsRepository, InstancesRepository } from '@features/persistence/backend/repositories/models.js';

type Outputs = InferContractRouterOutputs<typeof statisticsContract>;

export interface ChartReader<Output> {
	getChart(span: 'day' | 'hour', limit: number, offset: Date | null): Promise<Output>;
}

export interface GroupedChartReader<Output> {
	getChart(span: 'day' | 'hour', limit: number, offset: Date | null, group: string): Promise<Output>;
}

export interface StatisticsDependencies {
	charts: {
		activeUsers: ChartReader<Outputs['activeUsers']>;
		apRequest: ChartReader<Outputs['apRequest']>;
		drive: ChartReader<Outputs['drive']>;
		federation: ChartReader<Outputs['federation']>;
		instance: GroupedChartReader<Outputs['instance']>;
		notes: ChartReader<Outputs['notes']>;
		userDrive: GroupedChartReader<Outputs['userDrive']>;
		userFollowing: GroupedChartReader<Outputs['userFollowing']>;
		userNotes: GroupedChartReader<Outputs['userNotes']>;
		userPv: GroupedChartReader<Outputs['userPv']>;
		userReactions: GroupedChartReader<Outputs['userReactions']>;
		users: ChartReader<Outputs['users']>;
	};
	readRetention(options: { order: { id: 'DESC' }; take: 30 }): Promise<{ createdAt: Date; usersCount: number; data: Record<string, number> }[]>;
	readNotes(): Promise<{ local: number; remote: number }>;
	readUsers(): Promise<{ local: number; remote: number }>;
	countReactions(): Promise<number>;
	countInstances(): Promise<number>;
}

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

type StatisticsRouter = ReturnType<typeof createStatisticsRouter<MiLocalUser>>;

@Injectable()
export class StatisticsApiProvider {
	private router: StatisticsRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): StatisticsRouter {
		if (this.router !== undefined) return this.router;
		const activeUsers = this.moduleRef.get(ActiveUsersChart, { strict: false });
		const apRequest = this.moduleRef.get(ApRequestChart, { strict: false });
		const drive = this.moduleRef.get(DriveChart, { strict: false });
		const federation = this.moduleRef.get(FederationChart, { strict: false });
		const instance = this.moduleRef.get(InstanceChart, { strict: false });
		const notes = this.moduleRef.get(NotesChart, { strict: false });
		const userDrive = this.moduleRef.get(PerUserDriveChart, { strict: false });
		const userFollowing = this.moduleRef.get(PerUserFollowingChart, { strict: false });
		const userNotes = this.moduleRef.get(PerUserNotesChart, { strict: false });
		const userPv = this.moduleRef.get(PerUserPvChart, { strict: false });
		const userReactions = this.moduleRef.get(PerUserReactionsChart, { strict: false });
		const users = this.moduleRef.get(UsersChart, { strict: false });
		const retention = this.moduleRef.get<RetentionAggregationsRepository>(DI.retentionAggregationsRepository, { strict: false });
		const reactions = this.moduleRef.get<NoteReactionsRepository>(DI.noteReactionsRepository, { strict: false });
		const instances = this.moduleRef.get<InstancesRepository>(DI.instancesRepository, { strict: false });
		this.router = createStatisticsRouter<MiLocalUser>({
			charts: { activeUsers, apRequest, drive, federation, instance, notes, userDrive, userFollowing, userNotes, userPv, userReactions, users },
			readRetention: options => retention.find(options),
			readNotes: async () => { const chart = await notes.getChart('hour', 1, null); return { local: chart.local.total[0], remote: chart.remote.total[0] }; },
			readUsers: async () => { const chart = await users.getChart('hour', 1, null); return { local: chart.local.total[0], remote: chart.remote.total[0] }; },
			countReactions: () => reactions.count({ cache: 3600000 }),
			countInstances: () => instances.count({ cache: 3600000 }),
		});
		return this.router;
	}
}
