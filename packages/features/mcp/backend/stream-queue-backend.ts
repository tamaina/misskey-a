/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RedisQueueBackend, RedisConnection, QueueKeys } from 'bullmq';
import { addStandardJob } from 'bullmq/dist/cjs/scripts/addStandardJob-9.js';
import { STREAM_QUEUE_GLOBAL_LIMIT, STREAM_QUEUE_SUBSCRIPTION_LIMIT } from './stream-queue-admission.js';
import type { BackendFactory, JobJson, RedisClient, IRedisTransaction, ParentKeyOpts, KeysMap } from 'bullmq';

export class StreamQueueFullError extends Error { }
export class StreamQueueExpiredError extends Error { }
/** BullMQ's pinned standard-job script plus admission, in one Redis execution. */
const atomicAdd = `
local mcpData = cjson.decode(ARGV[2])
local mcpTime = redis.call('TIME')
local mcpNow = tonumber(mcpTime[1]) * 1000 + tonumber(mcpTime[2]) / 1000
local mcpSource = mcpData.source
if type(mcpSource) ~= 'table' or type(mcpSource.createdAt) ~= 'number' then return -101 end
local mcpAge = 900000
if mcpSource.channel == 'statisticsStream:serverStats' or mcpSource.channel == 'statisticsStream:queueStats' then mcpAge = 30000 end
if mcpSource.createdAt > mcpNow + 5000 or mcpSource.createdAt < mcpNow - mcpAge then return -101 end
local mcpArgs = cmsgpack.unpack(ARGV[1])
local mcpId = mcpArgs[2]
local mcpSub = mcpArgs[3]
if redis.call('EXISTS', mcpArgs[1] .. mcpId) == 0 then
 if redis.call('HLEN', KEYS[10]) >= ${STREAM_QUEUE_GLOBAL_LIMIT} or redis.call('SCARD', KEYS[11]) >= ${STREAM_QUEUE_SUBSCRIPTION_LIMIT} then return -100 end
 redis.call('HSET', KEYS[10], mcpId, mcpSub)
 redis.call('SADD', KEYS[11], mcpId)
end
` + addStandardJob.content;

class StreamQueueBackend extends RedisQueueBackend {
	public override async addJobToTransaction(client: RedisClient | IRedisTransaction, job: JobJson, jobId: string, parentKeyOpts: ParentKeyOpts = {}, keys?: KeysMap) {
		// All stream producers must use the atomically bounded standard-job path.
		// Worker retry delays use moveToDelayed and retain their original slot.
		if (job.opts.delay || job.opts.priority || ('repeat' in job.opts && job.opts.repeat) || job.parent || parentKeyOpts.addToWaitingChildren || job.opts.deduplication) throw new Error('Unsupported MCP stream producer options');
		return super.addJobToTransaction(client, job, jobId, parentKeyOpts, keys);
	}
	protected override async addStandardJob(client: RedisClient | IRedisTransaction, job: JobJson, encodedOpts: unknown, args: (string | number | Record<string, unknown>)[]) {
		const commands = await this.client;
		commands.defineCommand('mcpStreamAtomicAddV1', { numberOfKeys: 11, lua: atomicAdd });
		const values = this.addStandardJobArgs(job, encodedOpts, args);
		values.splice(9, 0, this.toKey('stream-pending'), this.toKey(`stream-pending-${job.name}`));
		const result = await client.runCommand('mcpStreamAtomicAddV1', values);
		if (result === -100) throw new StreamQueueFullError('MCP stream capacity reached');
		if (result === -101) throw new StreamQueueExpiredError('MCP stream expired');
		return result as string | number;
	}
}

/** Producers only; ordinary workers can consume the resulting standard Bull jobs. */
export const streamQueueBackendFactory: BackendFactory<RedisQueueBackend> = (name, opts) => {
	const connection = new RedisConnection(opts.connection, { shared: false, blocking: false, skipVersionCheck: opts.skipVersionCheck });
	const keys = new QueueKeys('prefix' in opts && typeof opts.prefix === 'string' ? opts.prefix : undefined);
	return new StreamQueueBackend(connection, name, keys.getKeys(name), type => keys.toKey(name, type), opts);
};
