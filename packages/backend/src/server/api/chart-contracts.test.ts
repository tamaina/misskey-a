/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { EntitySchema } from 'typeorm';
import frozen from '../../../test/fixtures/chart-contract-baseline.json' with { type: 'json' };
import * as descriptors from '@features/statistics/shared/chart-descriptors.js';
import * as chartEntity0 from '@features/statistics/backend/charts/definitions/active-users.js';
import * as chartEntity1 from '@features/statistics/backend/charts/definitions/ap-request.js';
import * as chartEntity2 from '@features/statistics/backend/charts/definitions/drive.js';
import * as chartEntity3 from '@features/statistics/backend/charts/definitions/federation.js';
import * as chartEntity4 from '@features/statistics/backend/charts/definitions/instance.js';
import * as chartEntity5 from '@features/statistics/backend/charts/definitions/notes.js';
import * as chartEntity6 from '@features/statistics/backend/charts/definitions/per-user-drive.js';
import * as chartEntity7 from '@features/statistics/backend/charts/definitions/per-user-following.js';
import * as chartEntity8 from '@features/statistics/backend/charts/definitions/per-user-notes.js';
import * as chartEntity9 from '@features/statistics/backend/charts/definitions/per-user-pv.js';
import * as chartEntity10 from '@features/statistics/backend/charts/definitions/per-user-reactions.js';
import * as chartEntity11 from '@features/statistics/backend/charts/definitions/users.js';

vi.mock('@features/persistence/backend/repositories/models.js', () => ({ miRepository: {} }));

const rows = [
	{ route: 'charts/active-users', entity: chartEntity0, descriptor: descriptors.activeUsersChartDescriptor },
	{ route: 'charts/ap-request', entity: chartEntity1, descriptor: descriptors.apRequestChartDescriptor },
	{ route: 'charts/drive', entity: chartEntity2, descriptor: descriptors.driveChartDescriptor },
	{ route: 'charts/federation', entity: chartEntity3, descriptor: descriptors.federationChartDescriptor },
	{ route: 'charts/instance', entity: chartEntity4, descriptor: descriptors.instanceChartDescriptor },
	{ route: 'charts/notes', entity: chartEntity5, descriptor: descriptors.notesChartDescriptor },
	{ route: 'charts/user/drive', entity: chartEntity6, descriptor: descriptors.perUserDriveChartDescriptor },
	{ route: 'charts/user/following', entity: chartEntity7, descriptor: descriptors.perUserFollowingChartDescriptor },
	{ route: 'charts/user/notes', entity: chartEntity8, descriptor: descriptors.perUserNotesChartDescriptor },
	{ route: 'charts/user/pv', entity: chartEntity9, descriptor: descriptors.perUserPvChartDescriptor },
	{ route: 'charts/user/reactions', entity: chartEntity10, descriptor: descriptors.perUserReactionsChartDescriptor },
	{ route: 'charts/users', entity: chartEntity11, descriptor: descriptors.usersChartDescriptor },
] as const;

function normalizeMetadata(value: unknown): unknown {
	if (value === undefined) return { $undefined: true };
	if (typeof value === 'bigint') return { $bigint: value.toString() };
	if (typeof value === 'function') return { $function: value.toString() };
	if (typeof value === 'symbol') throw new Error('Unsupported symbol in chart metadata');
	if (value instanceof Date) return { $date: value.toISOString() };
	if (value instanceof RegExp) return { $regexp: value.toString() };
	if (Array.isArray(value)) return value.map(normalizeMetadata);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeMetadata(entry)]));
	}
	if (typeof value === 'number' && !Number.isFinite(value)) return { $number: String(value) };
	return value;
}

test('all chart descriptors and their ordered metric options match the frozen baseline', () => {
	expect(rows).toHaveLength(12);
	for (const row of rows) {
		const old = frozen.routes.find(entry => entry.route === row.route)!;
		expect(row.descriptor).toEqual(old.descriptor);
		expect(Object.keys(row.descriptor)).toEqual(old.descriptorKeyOrder);
		expect(row.entity.schema).toBe(row.descriptor);
		expect(row.entity.name).toBe(old.entityName);
	}
});

test('all 24 real hour/day EntitySchema options remain deterministically equivalent', () => {
	for (const row of rows) {
		const old = frozen.routes.find(entry => entry.route === row.route)!;
		for (const span of ['hour', 'day'] as const) {
			expect(row.entity.entity[span]).toBeInstanceOf(EntitySchema);
			expect(normalizeMetadata(row.entity.entity[span].options)).toEqual(old.entities[span]);
		}
	}
});
