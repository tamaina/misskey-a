/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import { toJsonSchema } from '@valibot/to-json-schema';
import type { JsonSchema } from '@valibot/to-json-schema';
import { statisticsContract, statsResult } from '../contract/index.js';
import { objectParams } from '../../api/contract/index.js';
import type { StatisticsEndpoints } from '../contract/index.js';

export interface StatisticsDependencies {
	readNotes(): Promise<{ local: number; remote: number }>;
	readUsers(): Promise<{ local: number; remote: number }>;
	countReactions(): Promise<number>;
	countInstances(): Promise<number>;
}

export function createStats(deps: StatisticsDependencies) {
	return createProcedureClient(implement(statisticsContract.stats).handler(async () => {
		const notes = await deps.readNotes();
		const notesCount = notes.local + notes.remote;
		const originalNotesCount = notes.local;

		const users = await deps.readUsers();
		const usersCount = users.local + users.remote;
		const originalUsersCount = users.local;

		const [reactionsCount, instances] = await Promise.all([
			deps.countReactions(),
			deps.countInstances(),
		]);

		return {
			notesCount,
			originalNotesCount,
			usersCount,
			originalUsersCount,
			reactionsCount,
			instances,
			driveUsageLocal: 0,
			driveUsageRemote: 0,
		} satisfies StatisticsEndpoints['stats']['res'];
	}));
}

export function createStatistics(deps: StatisticsDependencies) {
	return { stats: createStats(deps) };
}

export type StatisticsFeature = ReturnType<typeof createStatistics>;

const { $schema: _inputDialect, ...input } = toJsonSchema(objectParams, {
	overrideSchema: ({ valibotSchema }) => valibotSchema === objectParams
		? { type: 'object', properties: {}, additionalProperties: true }
		: undefined,
});
const { $schema: _outputDialect, ...output } = toJsonSchema(statsResult);
export const legacyStatsSchemas: { input: JsonSchema; output: JsonSchema } = { input, output };
