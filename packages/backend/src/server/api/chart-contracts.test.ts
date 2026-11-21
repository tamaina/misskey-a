/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { EntitySchema } from 'typeorm';
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

test('each chart entity is built from the same shared descriptor the API publishes', () => {
	for (const row of rows) {
		expect(row.entity.schema, row.route).toBe(row.descriptor);
	}
	expect(new Set(rows.map(row => row.entity.name)).size).toBe(rows.length);
});

test('hour/day EntitySchemas use distinct tables and keep a column for every descriptor metric', () => {
	const tableNames = new Set<string | undefined>();
	for (const row of rows) {
		for (const span of ['hour', 'day'] as const) {
			const schema = row.entity.entity[span];
			expect(schema).toBeInstanceOf(EntitySchema);
			tableNames.add(schema.options.tableName);
			const columns = Object.keys(schema.options.columns);
			for (const key of Object.keys(row.descriptor)) {
				expect(columns, `${row.route} ${span} ${key}`).toContain(`___${key.replaceAll('.', '_')}`);
			}
		}
	}
	expect(tableNames.size).toBe(rows.length * 2);
});
