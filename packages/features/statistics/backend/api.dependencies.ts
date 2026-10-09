/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { statisticsContract } from './endpoints/statistics.contract.js';
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
