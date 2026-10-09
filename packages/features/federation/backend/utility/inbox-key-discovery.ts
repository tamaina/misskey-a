/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MinimalJob } from 'bullmq';

export class InboxKeyDiscoveryRefreshError extends Error {
	constructor(cause: unknown) {
		super('Actor refresh failed during key discovery', { cause });
		this.name = 'InboxKeyDiscoveryRefreshError';
	}
}

/** Only an absent key whose Actor refresh is still in its cooldown may wait. */
export class InboxKeyDiscoveryDeferredError extends Error {
	constructor(public readonly retryAt: number) {
		super('Actor key discovery deferred until refresh cooldown expires');
		this.name = 'InboxKeyDiscoveryDeferredError';
	}
}

export const INBOX_KEY_DISCOVERY_MAX_ELAPSED_MS = 15 * 60 * 1000;

/** Uses the ordinary attempts budget, including attempts=1 (no retry). */
export function inboxKeyDiscoveryBackoff(error: InboxKeyDiscoveryDeferredError, job?: Pick<MinimalJob, 'timestamp'>): number {
	const now = Date.now();
	if (job == null || !Number.isFinite(job.timestamp) || !Number.isFinite(error.retryAt) || job.timestamp > now) return -1;
	const deadline = job.timestamp + INBOX_KEY_DISCOVERY_MAX_ELAPSED_MS;
	const target = Math.max(now + 1000, error.retryAt);
	if (now >= deadline || target >= deadline) return -1;
	return target - now;
}
