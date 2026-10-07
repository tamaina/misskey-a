/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { Packed } from '@features/index/contract/packed.js';

type JobSnapshotInput = {
	id?: string;
	name: string;
	data: unknown;
	opts: Record<string, unknown>;
	timestamp: number;
	processedOn?: number;
	processedBy?: string;
	finishedOn?: number;
	progress: number;
	attemptsMade: number;
	delay: number;
	failedReason: string;
	stacktrace: string[] | null;
	returnvalue: unknown;
};

type PackJobDataMethod = (
	this: { redactJobData: (queueType: string, data: unknown) => unknown },
	queueType: 'system',
	job: JobSnapshotInput,
) => Packed<'QueueJob'>;

test('packJobData snapshots all enumerable job options into an opaque record', () => {
	// Model the normalized shape returned by BullMQ's Job constructor. The method
	// only reads this snapshot; no Queue, Redis connection, or service constructor is needed.
	const job: JobSnapshotInput = {
		id: 'job-id',
		name: 'test-job',
		data: {},
		opts: Object.assign({ attempts: 0 }, {
			attempts: 4,
			customOpaqueOption: { retain: true },
		}),
		timestamp: 1,
		progress: 0,
		attemptsMade: 0,
		delay: 0,
		failedReason: '',
		stacktrace: [],
		returnvalue: null,
	};
	const service = { redactJobData: (_queueType: string, data: unknown) => data };
	const packJobData = Reflect.get(QueueService.prototype, 'packJobData') as PackJobDataMethod;

	const packed = packJobData.call(service, 'system', job);

	expect(packed.opts).toEqual(expect.objectContaining({
		attempts: 4,
		customOpaqueOption: { retain: true },
	}));
	expect(packed.opts).not.toBe(job.opts);
	expect(Object.getPrototypeOf(packed.opts)).toBe(Object.prototype);
});
