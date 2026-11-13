/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, it, vi } from 'vitest';
import { McpStreamDeliverProcessorService } from '@features/integrations/backend/jobs/McpStreamDeliverProcessorService.js';
import type { McpStreamDeliverJobData } from '@features/runtime/backend/queue/types.js';
import type { Job } from 'bullmq';
vi.mock('@features/mcp/backend/McpStreamAccessService.js', () => ({ McpStreamAccessService: class {} }));
const frame = { type: 'channel', body: { id: 'subscription', type: 'note', body: { id: 'note-id' } } };

function fixture() {
	const webhook = { id: 'subscription', url: 'https://synthetic.example', secret: 'whsec_' + Buffer.alloc(32, 7).toString('base64'), mcpStream: { channel: 'homeTimeline' } };
	const authorize = vi.fn(async () => ({ webhook, frames: [frame] } as unknown as Awaited<ReturnType<import('@features/mcp/backend/McpStreamAccessService.js').McpStreamAccessService['authorize']>>));
	const update = vi.fn(async () => {});
	const sendMcpWebhook = vi.fn(async (_url: string, _body: string, _headers: unknown, _signal: unknown, guard?: () => Promise<void>) => {
		await guard?.(); return { ok: true, status: 200 };
	});
	const service = new McpStreamDeliverProcessorService({ update } as never, { sendMcpWebhook } as never, { authorize } as never);
	const job = { data: { webhookId: 'subscription', userId: 'owner', generation: 'generation', eventId: 'event-id',
		source: { id: 'source-id', channel: 'homeTimeline', createdAt: Date.now(), message: { type: 'note', body: { noteId: 'note-id' } } } } } as unknown as Job<McpStreamDeliverJobData>;
	return { webhook, authorize, update, sendMcpWebhook, service, job };
}

it('suppresses revoked/expired sources before HTTP', async () => {
	const f = fixture(); f.authorize.mockResolvedValue(null);
	expect(await f.service.process(f.job)).toBe('Suppressed'); expect(f.sendMcpWebhook).not.toHaveBeenCalled();
	const expired = fixture(); expired.job.data.source.createdAt = Date.now() - 16 * 60 * 1000;
	expect(await expired.service.process(expired.job)).toBe('Expired'); expect(expired.authorize).not.toHaveBeenCalled();
	const stats = fixture(); stats.job.data.source.channel = 'statisticsStream:serverStats'; stats.job.data.source.createdAt = Date.now() - 31000;
	expect(await stats.service.process(stats.job)).toBe('Expired');
});
it('signs the authorized projection and rechecks after DNS', async () => {
	const f = fixture(); expect(await f.service.process(f.job)).toBe('Success');
	expect(f.authorize).toHaveBeenCalledTimes(2);
	const body = JSON.parse(f.sendMcpWebhook.mock.calls[0][1]);
	expect(body).toEqual({ eventId: 'event-id', name: 'stream.channel', timestamp: new Date(f.job.data.source.createdAt).toISOString(), data: { frames: [frame] }, cursor: null });
	expect(f.update).toHaveBeenCalledOnce();
});
it('suppresses revocation after DNS and retries changed projections without exposing payload errors', async () => {
	const revoked = fixture(); revoked.authorize.mockResolvedValueOnce({ webhook: revoked.webhook, frames: [frame] } as never).mockResolvedValueOnce(null);
	expect(await revoked.service.process(revoked.job)).toBe('Suppressed'); expect(revoked.update).not.toHaveBeenCalled();
	const changed = fixture(); changed.authorize.mockResolvedValueOnce({ webhook: changed.webhook, frames: [frame] } as never)
		.mockResolvedValueOnce({ webhook: changed.webhook, frames: [{ type: 'changed-sensitive-value' }] } as never);
	await expect(changed.service.process(changed.job)).rejects.toThrow('MCP stream callback request failed');
	expect(changed.update).not.toHaveBeenCalled();
});

it('retries signing when secret or destination rotates after DNS', async () => {
	for (const mutation of [{ secret: 'rotated-secret' }, { url: 'https://rotated.example' }]) {
		const f = fixture();
		f.authorize.mockResolvedValueOnce({ webhook: f.webhook, frames: [frame] } as never)
			.mockResolvedValueOnce({ webhook: { ...f.webhook, ...mutation }, frames: [frame] } as never);
		await expect(f.service.process(f.job)).rejects.toThrow('MCP stream callback request failed');
		expect(f.update).not.toHaveBeenCalled();
	}
});
