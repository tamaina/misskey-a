/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import type { Worker } from 'node:cluster';

/** Keep IPC connected while workers handle SIGTERM and finish their own roles. */
export async function stopClusterWorkers(workers: readonly Worker[] = Object.values(cluster.workers ?? {}).filter((worker): worker is Worker => worker !== undefined)) {
	const results = await Promise.allSettled(workers.map(worker => new Promise<void>((resolve, reject) => {
		if (worker.isDead()) { resolve(); return; }
		const onExit = () => { resolve(); };
		worker.once('exit', onExit);
		try {
			if (!worker.process.kill('SIGTERM')) throw new Error('Could not signal worker');
		} catch (error) {
			worker.off('exit', onExit);
			reject(error);
		}
	})));
	const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
	if (errors.length) throw new AggregateError(errors, 'Worker shutdown failed');
}
