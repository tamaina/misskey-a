/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { statisticsContract } from './endpoints/statistics.contract.js';
export { createStatisticsRouter } from './router.js';
export { createStatisticsOperations } from './operations.js';
export type { StatisticsContext, StatisticsOperations, StatisticsDependencies, ChartReader, GroupedChartReader } from './operations.js';

import { createProcedureClient, implement } from '@orpc/server';
import { statsContract } from './endpoints/stats.contract.js';
import type { StatisticsDependencies } from './operations.js';

export type StatsDependencies = Pick<StatisticsDependencies, 'readNotes' | 'readUsers' | 'countReactions' | 'countInstances'>;

/** Compatibility application API for hosts outside the migrated HTTP cohort. */
export function createStats(deps: StatsDependencies) {
	return createProcedureClient(implement(statsContract).handler(async () => {
		const notes = await deps.readNotes();
		const users = await deps.readUsers();
		const [reactionsCount, instances] = await Promise.all([deps.countReactions(), deps.countInstances()]);
		return { notesCount: notes.local + notes.remote, originalNotesCount: notes.local,
			usersCount: users.local + users.remote, originalUsersCount: users.local,
			reactionsCount, instances, driveUsageLocal: 0, driveUsageRemote: 0 };
	}));
}

export function createStatistics(deps: StatsDependencies) {
	return { stats: createStats(deps) };
}
export type StatisticsFeature = ReturnType<typeof createStatistics>;
