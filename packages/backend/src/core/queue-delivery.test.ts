/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { QueueService } from '@/core/QueueService.js';

describe('delivery destination guard', () => {
	function service() {
		const addBulk = vi.fn().mockResolvedValue([]);
		const queue = Object.assign(Object.create(QueueService.prototype), {
			config: {},
			deliverQueue: { addBulk },
		}) as QueueService;
		return { queue, addBulk };
	}

	test.each([new Map<string, boolean>(), new Map([[null as unknown as string, true]])])('does not enqueue an empty destination set', async inboxes => {
		const { queue, addBulk } = service();
		expect(await queue.deliverMany({ id: 'actor' }, { type: 'Delete', actor: 'https://local.example/users/actor', object: 'https://local.example/users/actor' }, inboxes)).toBeNull();
		expect(addBulk).not.toHaveBeenCalled();
	});

	test('drops a null destination while preserving valid destinations and the caller map', async () => {
		const { queue, addBulk } = service();
		const inboxes = new Map([[null as unknown as string, true], ['https://remote.example/inbox', false]]);
		await queue.deliverMany({ id: 'actor' }, { type: 'Delete', actor: 'https://local.example/users/actor', object: 'https://local.example/users/actor' }, inboxes);
		expect(inboxes.size).toBe(2);
		expect(inboxes.has(null as unknown as string)).toBe(true);
		expect(addBulk).toHaveBeenCalledOnce();
		expect(addBulk.mock.calls[0][0]).toEqual([
			expect.objectContaining({ data: expect.objectContaining({ to: 'https://remote.example/inbox', isSharedInbox: false }) }),
		]);
	});

	test('does not enqueue a null activity', async () => {
		const { queue, addBulk } = service();
		await queue.deliverMany({ id: 'actor' }, null, new Map([['https://remote.example/inbox', true]]));
		expect(addBulk).not.toHaveBeenCalled();
	});
});
