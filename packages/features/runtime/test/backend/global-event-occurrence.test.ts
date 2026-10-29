/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';

it('assigns a new occurrence to identical publications without changing the legacy message', () => {
	const publish = vi.fn();
	const service = new GlobalEventService({ host: 'synthetic.example' } as never, { publish } as never);
	const now = Date.now();
	service.publishBroadcastStream('emojiDeleted', { emojis: [] });
	service.publishBroadcastStream('emojiDeleted', { emojis: [] });
	const envelopes = publish.mock.calls.map(([, text]) => JSON.parse(text));
	expect(envelopes[0].message).toEqual({ type: 'emojiDeleted', body: { emojis: [] } });
	expect(envelopes[0].channel).toBe('broadcast');
	expect(envelopes[0].occurrenceId).toMatch(/^[0-9a-f-]{36}$/);
	expect(envelopes[1].occurrenceId).not.toBe(envelopes[0].occurrenceId);
	expect(envelopes[0].createdAt).toBeGreaterThanOrEqual(now);
	expect(envelopes[0].createdAt).toBeLessThanOrEqual(Date.now());
});

it.each(['serverStats', 'queueStats'] as const)('shares one published %s identity across two observers', channel => {
	const bus = new EventEmitter();
	const first = vi.fn(); const second = vi.fn();
	bus.on('publication', first); bus.on('publication', second);
	const publish = vi.fn((_host: string, text: string) => bus.emit('publication', JSON.parse(text)));
	const service = new GlobalEventService({ host: 'synthetic.example' } as never, { publish } as never);
	const stats = { cpu: 0.25, mem: { used: 123 } };
	service.publishStatisticsStream(channel, stats);
	expect(publish).toHaveBeenCalledOnce();
	expect(first).toHaveBeenCalledOnce(); expect(second).toHaveBeenCalledOnce();
	expect(first.mock.calls[0][0]).toEqual(second.mock.calls[0][0]);
	expect(first.mock.calls[0][0]).toMatchObject({ channel: `statisticsStream:${channel}`, message: { type: 'stats', body: stats }, occurrenceId: expect.any(String), createdAt: expect.any(Number) });
});
