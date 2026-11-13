/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, expect, test, vi } from 'vitest';
import { QueueService } from '../../../runtime/backend/services/QueueService.js';

function fixture() {
	vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-14T00:00:00.000Z'));
	const systemQueue = { getJob: vi.fn(), remove: vi.fn(), add: vi.fn() };
	const service = Object.assign(Object.create(QueueService.prototype) as QueueService, { systemQueue });
	return { service, systemQueue };
}

afterEach(() => vi.useRealTimers());

test('schedules a stable deadline-specific id and immediately queues overdue archives', async () => {
	const { service, systemQueue } = fixture();
	const at = new Date(Date.now() - 1000);
	await service.scheduleAnnouncementArchive('announcement123', at);
	expect(systemQueue.add).toHaveBeenCalledWith('archiveAnnouncement', { announcementId: 'announcement123', autoArchiveAt: at.getTime() }, expect.objectContaining({ jobId: `archiveAnnouncement-announcement123-${at.getTime()}`, delay: 0 }));
	await service.clearAnnouncementArchive('announcement123', at);
	expect(systemQueue.remove).toHaveBeenCalledWith(`archiveAnnouncement-announcement123-${at.getTime()}`);
});

test.each(['delayed', 'completed', 'failed'])('existing %s job is deduplicated or replaced as appropriate', async state => {
	const { service, systemQueue } = fixture();
	systemQueue.getJob.mockResolvedValue({ getState: vi.fn(async () => state) });
	await service.scheduleAnnouncementArchive('announcement123', new Date(Date.now() + 1000));
	expect(systemQueue.add).toHaveBeenCalledTimes(state === 'delayed' ? 0 : 1);
	expect(systemQueue.remove).toHaveBeenCalledTimes(state === 'delayed' ? 0 : 1);
});
