/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Queue } from 'bullmq';

export const STREAM_QUEUE_GLOBAL_LIMIT = 8192;
export const STREAM_QUEUE_SUBSCRIPTION_LIMIT = 128;
export const STREAM_QUEUE_RETENTION_SECONDS = 86400;
export const STREAM_QUEUE_MAX_AGE_MS = 15 * 60 * 1000;

const releaseScript = `
local subscription = redis.call('HGET', KEYS[1], ARGV[1])
if subscription == ARGV[2] then
 redis.call('HDEL', KEYS[1], ARGV[1])
 redis.call('SREM', KEYS[2], ARGV[1])
end
return 1`;

function keys(queue: Queue, subscription: string) {
	return [queue.toKey('stream-pending'), queue.toKey(`stream-pending-${subscription}`)];
}

export async function releaseStreamJob(queue: Queue, id: string, subscription: string): Promise<void> {
	const client = await queue.getBackend().client;
	client.defineCommand('mcpStreamReleaseV1', { numberOfKeys: 2, lua: releaseScript });
	await client.runCommand('mcpStreamReleaseV1', [...keys(queue, subscription), id, subscription]);
}
/** Repair a crash after Bull terminal transition but before its event handler. */
export async function reconcileStreamJobs(queue: Queue): Promise<void> {
	const client = await queue.getBackend().client;
	const pending = await client.hgetall(queue.toKey('stream-pending'));
	for (const [id, subscription] of Object.entries(pending)) {
		const job = await queue.getJob(id);
		if (!job) { await releaseStreamJob(queue, id, subscription); continue; } // Admission/insertion is atomic; absent jobs cannot be pending producers.
		const state = await job.getState();
		if (state === 'completed' || state === 'failed') await releaseStreamJob(queue, id, subscription);
	}
	// Bull's age-based removal normally runs on the next terminal job. Sweep on
	// maintenance too so an idle queue does not retain references indefinitely.
	await queue.clean(STREAM_QUEUE_RETENTION_SECONDS * 1000, 1000, 'completed');
	await queue.clean(STREAM_QUEUE_RETENTION_SECONDS * 1000, 1000, 'failed');
}
