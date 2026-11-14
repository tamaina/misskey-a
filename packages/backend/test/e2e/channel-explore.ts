/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { api, initTestDb, signup } from '../utils.js';
import { MiChannel } from '@features/channels/backend/models/Channel.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { loadConfig } from '@/config.js';
import type { DataSource } from 'typeorm';

describe('Channel exploration origin', () => {
	let db: DataSource;
	const rows: Partial<MiChannel>[] = [];
	const base = Date.now() - 120_000;
	const keyword = 'explore-origin-fixture';
	const idService = new IdService(loadConfig());
	const descending = (a: Partial<MiChannel>, b: Partial<MiChannel>) => a.id! < b.id! ? 1 : -1;
	const active = (origin?: 'local' | 'remote') => rows.filter(row => !row.isArchived && (origin === undefined || (origin === 'local' ? row.host === null : row.host !== null)));
	const ids = (channels: { id?: string }[]) => channels.map(channel => channel.id);

	beforeAll(async () => {
		const owner = await signup();
		db = await initTestDb(true);
		for (let i = 0; i < 32; i++) {
			const remote = i % 2 === 1;
			rows.push({
				id: idService.gen(base + i * 1000), userId: owner.id,
				name: i === 4 || i === 5 ? 'description only' : `${keyword}-${i}`,
				description: `${keyword} description`,
				host: remote ? 'remote.example.test' : null,
				uri: remote ? `https://remote.example.test/channels/${i}` : null,
				isFederated: remote,
				isArchived: i >= 28,
				// Equal activity times exercise the deterministic ID tie-breaker.
				lastNotedAt: i === 26 || i === 27 ? null : new Date(base + Math.floor(i / 4) * 1000),
			});
		}
		await db.getRepository(MiChannel).insert(rows);
	});
	afterAll(async () => { await db?.destroy(); });

	test('omitted origin retains mixed search, including an empty query', async () => {
		const result = await api('channels/search', { query: '', limit: 100 });
		expect(result.status).toBe(200);
		expect(ids(result.body)).toEqual(ids(active().sort(descending)));
		expect(result.body.some(channel => channel.host === null)).toBe(true);
		expect(result.body.some(channel => channel.host !== null)).toBe(true);
	});

	test.each(['local', 'remote'] as const)('%s filtering occurs before LIMIT and ID cursor pagination', async origin => {
		const expected = active(origin).sort(descending);
		const first = await api('channels/search', { origin, query: '', limit: 2 });
		expect(first.status).toBe(200);
		expect(ids(first.body)).toEqual(ids(expected.slice(0, 2)));
		const next = await api('channels/search', { origin, query: '', limit: 2, untilId: first.body[1].id });
		expect(ids(next.body)).toEqual(ids(expected.slice(2, 4)));
		const newer = await api('channels/search', { origin, query: '', limit: 2, sinceId: expected[4].id });
		expect(ids(newer.body)).toEqual(ids(expected.slice(2, 4).reverse()));
	});

	test.each(['local', 'remote'] as const)('%s date cursors keep the same origin and ordering', async origin => {
		const earlier = await api('channels/search', { origin, query: '', limit: 100, untilDate: base + 14_500 });
		expect(ids(earlier.body)).toEqual(ids(active(origin).filter(row => idService.parse(row.id!).date.getTime() < base + 14_500).sort(descending)));
		const later = await api('channels/search', { origin, query: '', limit: 100, sinceDate: base + 14_500 });
		expect(ids(later.body)).toEqual(ids(active(origin).filter(row => idService.parse(row.id!).date.getTime() > base + 14_500).sort(descending).reverse()));
	});

	test.each(['local', 'remote'] as const)('%s name/description alternatives cannot bypass origin or archived filters', async origin => {
		for (const type of ['nameOnly', 'nameAndDescription'] as const) {
			const result = await api('channels/search', { origin, query: keyword.toUpperCase(), type, limit: 100 });
			expect(result.status).toBe(200);
			expect(ids(result.body)).toEqual(ids(active(origin).filter(row => type === 'nameAndDescription' || row.name!.includes(keyword)).sort(descending)));
		}
		const escaped = await api('channels/search', { origin, query: '%', limit: 100 });
		expect(escaped.body).toEqual([]);
	});

	test.each([undefined, 'local', 'remote'] as const)('featured %s filters before its ten-item cap and breaks activity ties by ID', async origin => {
		const params = origin === undefined ? {} : { origin };
		const result = await api('channels/featured', params);
		const expected = active(origin).filter(row => row.lastNotedAt != null).sort((a, b) => b.lastNotedAt!.getTime() - a.lastNotedAt!.getTime() || descending(a, b)).slice(0, 10);
		expect(result.status).toBe(200);
		expect(ids(result.body)).toEqual(ids(expected));
		expect(result.body).toHaveLength(10);
	});
});
