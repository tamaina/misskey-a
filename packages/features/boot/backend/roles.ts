/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRuntime } from './runtime.js';

export type RoleName = 'server' | 'queue';
export interface ProcessRole {
	start(): Promise<void>;
	/** Stop admission and wait for active work/background readers. */
	drain(): Promise<void>;
	/** Persist buffered writes while every role still owns its infrastructure. */
	flush(): Promise<void>;
	close(): Promise<void>;
}

export function planRoles(options: {
	worker: boolean; disableClustering: boolean; onlyServer: boolean; onlyQueue: boolean;
}): RoleName[] {
	if (options.worker) return [options.onlyServer ? 'server' : 'queue'];
	if (options.disableClustering) {
		if (options.onlyServer) return ['server'];
		return options.onlyQueue ? ['queue'] : ['server', 'queue'];
	}
	if (options.onlyServer) return [];
	return [options.onlyQueue ? 'queue' : 'server'];
}

/** Role-wide barriers prevent one role closing a DB while another still flushes. */
export function createProcessRoles(names: readonly RoleName[], acquire: (name: RoleName) => Promise<ProcessRole>) {
	const roles: ProcessRole[] = [];
	let stopRequested = false;
	let closing: Promise<void> | undefined;

	function close() {
		return closing ??= (async () => {
			const errors: unknown[] = [];
			for (const phase of ['drain', 'flush', 'close'] as const) {
				const results = await Promise.allSettled([...roles].reverse().map(async role => role[phase]()));
				for (const result of results) if (result.status === 'rejected') errors.push(new Error(`Role ${phase} failed`, { cause: result.reason }));
			}
			if (errors.length) throw new AggregateError(errors, 'Role shutdown failed');
		})();
	}

	const runtime = createRuntime([{ name: 'process roles', async start() {
		try {
			for (const name of names) {
				if (stopRequested) break;
				const role = await acquire(name);
				roles.push(role);
			}
			for (const role of roles) {
				if (stopRequested) break;
				await role.start();
			}
		} catch (error) {
			try { await close(); } catch (cleanup) { throw new AggregateError([error, cleanup], 'Role startup and rollback failed'); }
			throw error;
		}
		return close;
	} }]);
	return {
		get state() { return runtime.state; },
		start: () => runtime.start(),
		stop() { stopRequested = true; return runtime.stop(); },
	};
}
