/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { statisticsContract } from '../../backend/endpoints/statistics.contract.js';
import { chartInput } from '../../backend/endpoints/charts/chart-input.schema.js';
const chartEndpointDefinitions = {
	'charts/active-users': { output: statisticsContract.activeUsers['~orpc'].outputSchema },
	'charts/ap-request': { output: statisticsContract.apRequest['~orpc'].outputSchema },
	'charts/drive': { output: statisticsContract.drive['~orpc'].outputSchema },
	'charts/federation': { output: statisticsContract.federation['~orpc'].outputSchema },
	'charts/instance': { output: statisticsContract.instance['~orpc'].outputSchema },
	'charts/notes': { output: statisticsContract.notes['~orpc'].outputSchema },
	'charts/user/drive': { output: statisticsContract.userDrive['~orpc'].outputSchema },
	'charts/user/following': { output: statisticsContract.userFollowing['~orpc'].outputSchema },
	'charts/user/notes': { output: statisticsContract.userNotes['~orpc'].outputSchema },
	'charts/user/pv': { output: statisticsContract.userPv['~orpc'].outputSchema },
	'charts/user/reactions': { output: statisticsContract.userReactions['~orpc'].outputSchema },
	'charts/users': { output: statisticsContract.users['~orpc'].outputSchema },
};
import * as descriptors from '../../shared/chart-descriptors.js';
import Chart from '../../backend/charts/core.js';
import { statsContract } from '../../backend/endpoints/stats.contract.js';
import { createStatisticsOperations } from '../../backend/operations.js';
import { createStats } from '../../backend/index.js';
import { retentionContract as nativeContract1, retentionContract as nativeContract2 } from '../../backend/endpoints/retention.contract.js';
import type { RetentionAggregationsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiRetentionAggregation } from '../../backend/models/RetentionAggregation.js';
import type { ChartMetricDescriptor } from '../../shared/chart-descriptors.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const remainingRetentionOutput = requiredSchema(nativeContract1['~orpc'].outputSchema);
const remainingRetentionDefinition = nativeContract2;

const item = { createdAt: '2026-01-01T00:00:00.000Z', users: 7, data: { '0': 7, '1': 3 } };

test('statistics finite envelopes reject shape drift and chart defaults remain static', () => {
	expect(v.parse(chartInput, { span: 'day', future: true })).toEqual({ span: 'day', limit: 30, offset: null });
	for (const value of [{}, { span: 'day', limit: 0 }, { span: 'day', offset: 'bad' }]) expect(v.safeParse(chartInput, value).success).toBe(false);
	expect(v.parse(remainingRetentionOutput, [item])).toEqual([item]);
	for (const value of [[{ ...item, future: true }], [{ users: 7, data: {} }], [{ ...item, data: { x: 'bad' } }]]) expect(v.safeParse(remainingRetentionOutput, value).success).toBe(false);
});

test('all twelve explicit chart schemas agree with actual chart nesting and close every branch', async () => {
	let branchCount = 0;
	const names = ['activeUsers', 'apRequest', 'drive', 'federation', 'instance', 'notes', 'perUserDrive', 'perUserFollowing', 'perUserNotes', 'perUserPv', 'perUserReactions', 'users'] as const;
	for (const [index, definition] of Object.values(chartEndpointDefinitions).entries()) {
		const descriptor = descriptors[`${names[index]}ChartDescriptor`];
		const output = requiredSchema(definition.output);
		const result: Record<string, unknown> = {};
		const raw: Record<string, number[]> = {};
		for (const path of Object.keys(descriptor)) {
			raw[path] = [1, 2];
			const parts = path.split('.');
			let branch = result;
			for (const key of parts.slice(0, -1)) {
				if (!(key in branch)) branch[key] = {};
				branch = branch[key] as Record<string, unknown>;
			}
			branch[parts.at(-1)!] = [1, 2];
		}
		const chart = mockDeep<Chart<ChartMetricDescriptor>>();
		chart.getChartRaw.mockResolvedValue(raw);
		const produced = await Reflect.apply(Chart.prototype.getChart, chart, ['day', 2, null]);
		expect(produced).toEqual(result);
		expect(v.parse(output, produced)).toEqual(result);

		function checkBranches(branch: Record<string, unknown>, path: string[] = []) {
			branchCount++;
			for (const mutation of ['extra', 'missing', 'wrong'] as const) {
				const invalid = structuredClone(result);
				let target = invalid;
				for (const key of path) target = target[key] as Record<string, unknown>;
				const firstKey = Object.keys(branch)[0];
				if (mutation === 'extra') target.future = [];
				else if (mutation === 'missing') delete target[firstKey];
				else target[firstKey] = 'bad';
				expect(v.safeParse(output, invalid).success, `${names[index]}:${path.join('.') || '<root>'}:${mutation}`).toBe(false);
			}
			for (const [key, child] of Object.entries(branch)) {
				if (!Array.isArray(child)) checkBranches(child as Record<string, unknown>, [...path, key]);
			}
		}

		checkBranches(result);
	}
	expect(branchCount).toBe(38);
});

test('stats empty input retains its non-array JSON-object guard and missing-body default', () => {
	const schema = statisticsContract.stats['~orpc'].inputSchema!;
	expect(v.parse(schema, undefined)).toEqual({});
	const request = { future: true };
	expect(v.parse(schema, request)).toEqual({});
	for (const value of [[], [1], null, 7, 'bad']) expect(v.safeParse(schema, value).success).toBe(false);
});

test('actual statistics and retention producers produce declared fields', async () => {
	const stats = createStats({ readNotes: async () => ({ local: 2, remote: 3 }), readUsers: async () => ({ local: 4, remote: 5 }), countReactions: async () => 6, countInstances: async () => 7 });
	const result = await stats({});
	expect(v.parse(statsContract['~orpc'].outputSchema!, result)).toEqual({ notesCount: 5, originalNotesCount: 2, usersCount: 9, originalUsersCount: 4, reactionsCount: 6, instances: 7, driveUsageLocal: 0, driveUsageRemote: 0 });
	expect(v.safeParse(statsContract['~orpc'].outputSchema!, { ...result, future: true }).success).toBe(false);
	const repository = mockDeep<RetentionAggregationsRepository>();
	repository.find.mockResolvedValue([mockDeep<MiRetentionAggregation>({ createdAt: new Date(item.createdAt), usersCount: item.users, data: item.data })]);
	expect(v.parse(remainingRetentionOutput, await createStatisticsOperations({ ...mockDeep<Parameters<typeof createStatisticsOperations>[0]>(), readRetention: () => repository.find() }).retention({}, null))).toEqual([item]);
});
