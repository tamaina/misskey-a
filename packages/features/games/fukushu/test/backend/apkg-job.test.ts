/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { sourceRestoreJob } from '../../backend/jobs/ImportFukushuProcessorService.js';

const input = { fileId: 'original', requestId: 'request', format: 'anki-apkg' } as const;

function fixture() {
	const job = { name: 'importFukushu', data: { ownerId: 'alice', ...input }, failedReason: 'private paths are not public', getState: vi.fn(async () => 'waiting') };
	const queue = { getJob: vi.fn(async () => job as typeof job | undefined), add: vi.fn() };
	const store = { restored: vi.fn(async () => false) };
	const inspector = { sourceIdentity: vi.fn(async () => ({ size: 123, md5: 'digest' })) };
	const submit = (options = input) => sourceRestoreJob(queue as never, store, inspector, 'alice', options);
	return { job, queue, store, inspector, submit };
}

test('only enqueues the verified identity, then polls without reading or creating another job', async () => {
	const f = fixture();
	f.queue.getJob.mockResolvedValueOnce(undefined);
	await expect(f.submit()).resolves.toEqual({ status: 'waiting' });
	expect(f.inspector.sourceIdentity).toHaveBeenCalledWith('alice', 'original', 'anki-apkg');
	expect(f.queue.add).toHaveBeenCalledWith('importFukushu', { ownerId: 'alice', ...input, size: 123, md5: 'digest' }, expect.objectContaining({ attempts: 1 }));
	f.job.getState.mockResolvedValue('active');
	expect(await sourceRestoreJob(f.queue as never, f.store, f.inspector, 'alice', { ...input, statusOnly: true })).toEqual({ status: 'running' });
	expect(f.queue.add).toHaveBeenCalledTimes(1);
});

test('foreign payload and mismatched file or format conflict; failed messages stay private', async () => {
	for (const patch of [{ ownerId: 'bob' }, { fileId: 'other' }, { format: undefined }]) {
		const f = fixture();
		Object.assign(f.job.data, patch);
		await expect(f.submit()).rejects.toThrow('STUDY_CONFLICT');
	}
	const f = fixture();
	f.job.getState.mockResolvedValue('failed');
	await expect(f.submit()).resolves.toEqual({ status: 'failed' });
	f.job.failedReason = 'APKG_UNSUPPORTED';
	await expect(f.submit()).resolves.toEqual({ status: 'failed', reason: 'unsupported' });
	f.job.failedReason = 'APKG_INVALID';
	await expect(f.submit()).resolves.toEqual({ status: 'failed', reason: 'invalid' });
});

test('a committed receipt survives queue eviction; an unknown polling ID never creates a job', async () => {
	const f = fixture();
	f.store.restored.mockResolvedValueOnce(true);
	await expect(f.submit()).resolves.toEqual({ status: 'completed' });
	expect(f.queue.getJob).not.toHaveBeenCalled();
	f.queue.getJob.mockResolvedValue(undefined);
	expect(await sourceRestoreJob(f.queue as never, f.store, f.inspector, 'alice', { ...input, statusOnly: true })).toEqual({ status: 'missing' });
	expect(f.queue.add).not.toHaveBeenCalled();
});
