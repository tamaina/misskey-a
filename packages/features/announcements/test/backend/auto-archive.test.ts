/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { AnnouncementService } from '../../backend/services/AnnouncementService.js';
import { MiAnnouncement } from '../../backend/models/Announcement.js';

const now = new Date('2026-10-14T00:00:00.000Z');
const future = new Date(now.getTime() + 60000);

function fixture() {
	vi.useFakeTimers();
	vi.setSystemTime(now);
	let row = new MiAnnouncement({ id: 'announcement123', isActive: true, autoArchiveAt: future, userId: null });
	// update() uses UPDATE ... RETURNING (upstream #18045); archive keeps the plain conditional UPDATE.
	let returningValues: Partial<MiAnnouncement> | undefined;
	let pendingValues: Partial<MiAnnouncement> | undefined;
	const query = {
		update: vi.fn(), set: vi.fn(), where: vi.fn(), andWhere: vi.fn(), returning: vi.fn(),
		execute: vi.fn(async () => {
			if (returningValues === undefined) return { affected: 1 };
			row = new MiAnnouncement({ ...row, ...Object.fromEntries(Object.entries(returningValues).filter(([, value]) => value !== undefined)) });
			returningValues = undefined;
			return { affected: 1, raw: [row] };
		}),
	};
	for (const method of ['update', 'where', 'andWhere'] as const) query[method].mockReturnValue(query);
	query.set.mockImplementation((values: Partial<MiAnnouncement>) => { pendingValues = values; return query; });
	query.returning.mockImplementation(() => { returningValues = pendingValues; return query; });
	const repository = {
		insertOne: vi.fn(async (values: Partial<MiAnnouncement>) => { row = new MiAnnouncement({ ...row, ...values }); return row; }),
		update: vi.fn(async (_id: string, values: Partial<MiAnnouncement>) => { row = new MiAnnouncement({ ...row, ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) }); }),
		findOneByOrFail: vi.fn(async () => row), findBy: vi.fn(async () => [row]), delete: vi.fn(),
		createQueryBuilder: vi.fn(() => query),
	};
	const queue = { scheduleAnnouncementArchive: vi.fn(), clearAnnouncementArchive: vi.fn() };
	const events = { publishMainStream: vi.fn(), publishBroadcastStream: vi.fn() };
	const service = new AnnouncementService(repository as never, {} as never, {} as never, { gen: () => row.id } as never, events, { log: vi.fn() } as never, { pack: vi.fn(async () => ({})) } as never, queue);
	return { service, repository, queue, query, events, row: () => row };
}

afterEach(() => vi.useRealTimers());

test('creates a deadline job and suppresses broadcast when insertion crosses the deadline', async () => {
	const { service, repository, queue, events } = fixture();
	repository.insertOne.mockImplementationOnce(async (values: Partial<MiAnnouncement>) => { vi.setSystemTime(future); return new MiAnnouncement({ id: 'announcement123', ...values }); });
	await service.create({ title: 'Title', autoArchiveAt: future });
	expect(queue.scheduleAnnouncementArchive).toHaveBeenCalledWith('announcement123', future);
	expect(events.publishBroadcastStream).not.toHaveBeenCalled();
});

test('restores active deadlines on initialization and replaces/clears changed deadlines', async () => {
	const { service, queue, row } = fixture();
	await service.restoreScheduledArchives();
	expect(queue.scheduleAnnouncementArchive).toHaveBeenCalledWith(row().id, future);
	const before = row();
	const changed = new Date(future.getTime() + 60000);
	await service.update(before, { autoArchiveAt: changed });
	expect(queue.clearAnnouncementArchive).toHaveBeenCalledWith(before.id, future);
	expect(queue.scheduleAnnouncementArchive).toHaveBeenLastCalledWith(before.id, changed);
	await service.update(row(), { autoArchiveAt: null });
	expect(queue.clearAnnouncementArchive).toHaveBeenLastCalledWith(before.id, changed);
});

test('archive is conditional on current deadline, active state and expiry and reports whether it changed', async () => {
	const { service, query } = fixture();
	expect(await service.archiveAnnouncement('announcement123', future)).toBe(true);
	expect(query.where).toHaveBeenCalledWith('id = :announcementId', { announcementId: 'announcement123' });
	expect(query.andWhere).toHaveBeenCalledWith('isActive = true');
	expect(query.andWhere).toHaveBeenCalledWith('autoArchiveAt = :autoArchiveAt', { autoArchiveAt: future });
	expect(query.andWhere).toHaveBeenCalledWith('autoArchiveAt <= :now', { now });
	query.execute.mockResolvedValueOnce({ affected: 0 });
	expect(await service.archiveAnnouncement('announcement123', future)).toBe(false);
});

test('delete clears the original scheduled job', async () => {
	const { service, queue, row } = fixture();
	await service.delete(row());
	expect(queue.clearAnnouncementArchive).toHaveBeenCalledWith('announcement123', future);
});
