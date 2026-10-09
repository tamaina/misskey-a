/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { statisticsContract } from './endpoints/statistics.contract.js';
import type * as v from 'valibot';
import type { chartInput, instanceChartInput, userChartInput } from './endpoints/charts/chart-input.schema.js';
import type { retentionInput } from './endpoints/retention.contract.js';
import type { statsInput } from './endpoints/stats.contract.js';

type ChartInput = v.InferOutput<typeof chartInput>;
type UserChartInput = v.InferOutput<typeof userChartInput>;
type Inputs = {
	activeUsers: ChartInput;
	apRequest: ChartInput;
	drive: ChartInput;
	federation: ChartInput;
	instance: v.InferOutput<typeof instanceChartInput>;
	notes: ChartInput;
	userDrive: UserChartInput;
	userFollowing: UserChartInput;
	userNotes: UserChartInput;
	userPv: UserChartInput;
	userReactions: UserChartInput;
	users: ChartInput;
	retention: v.InferOutput<typeof retentionInput>;
	stats: v.InferOutput<typeof statsInput>;
};
type Outputs = InferContractRouterOutputs<typeof statisticsContract>;

export type StatisticsOperations<Actor extends ApiActor> = {
	[K in keyof Inputs]: (input: Inputs[K], principal: Actor | null) => Promise<Outputs[K]>;
};
export type StatisticsContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { statistics: StatisticsOperations<Actor> };
};

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

export function createStatisticsOperations<Actor extends ApiActor>(deps: StatisticsDependencies): StatisticsOperations<Actor> {
	return {
		activeUsers: input => deps.charts.activeUsers.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null),
		apRequest: input => deps.charts.apRequest.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null),
		drive: input => deps.charts.drive.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null),
		federation: input => deps.charts.federation.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null),
		instance: input => deps.charts.instance.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.host),
		notes: input => deps.charts.notes.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null),
		userDrive: input => deps.charts.userDrive.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId),
		userFollowing: input => deps.charts.userFollowing.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId),
		userNotes: input => deps.charts.userNotes.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId),
		userPv: input => deps.charts.userPv.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId),
		userReactions: input => deps.charts.userReactions.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId),
		users: input => deps.charts.users.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null),
		retention: async () => {
			const records = await deps.readRetention({ order: { id: 'DESC' }, take: 30 });
			return records.map(record => ({ createdAt: record.createdAt.toISOString(), users: record.usersCount, data: record.data }));
		},
		stats: async () => {
			const notes = await deps.readNotes();
			const users = await deps.readUsers();
			const [reactionsCount, instances] = await Promise.all([deps.countReactions(), deps.countInstances()]);
			return {
				notesCount: notes.local + notes.remote, originalNotesCount: notes.local,
				usersCount: users.local + users.remote, originalUsersCount: users.local,
				reactionsCount, instances, driveUsageLocal: 0, driveUsageRemote: 0,
			};
		},
	};
}
