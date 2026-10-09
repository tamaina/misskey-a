/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { RetentionAggregationsRepository, NoteReactionsRepository, InstancesRepository } from '../../persistence/backend/repositories/models.js';
import { createStatisticsRouter } from './router.js';
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
