/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type Dispose = () => void | Promise<void>;

/** A step owns partial-start cleanup until it successfully returns its disposer. */
export interface BootStep {
	name: string;
	start(): Dispose | Promise<Dispose>;
}

export type RuntimeState = 'idle' | 'starting' | 'ready' | 'stopping' | 'stopped' | 'failed';

/**
 * Owns side-effect ordering, not dependency construction. Each process role has
 * its own runtime. Constructors and provider registration must remain inert.
 */
export function createRuntime(input: readonly BootStep[]) {
	const names = new Set<string>();
	const steps = input.map(step => {
		if (!step.name || names.has(step.name)) throw new Error(`Duplicate or empty boot step: ${step.name}`);
		names.add(step.name);
		return { name: step.name, start: () => step.start() };
	});
	let state: RuntimeState = 'idle';
	let starting: Promise<void> | undefined;
	let stopping: Promise<void> | undefined;
	let stopRequested = false;
	const resources: { name: string; dispose: Dispose }[] = [];

	async function disposeResources(): Promise<unknown[]> {
		const errors: unknown[] = [];
		while (resources.length > 0) {
			const resource = resources.pop()!;
			try {
				await resource.dispose();
			} catch (cause) {
				errors.push(new Error(`Failed to stop ${resource.name}`, { cause }));
			}
		}
		return errors;
	}

	return {
		get state(): RuntimeState { return state; },
		start(): Promise<void> {
			if (stopRequested) return Promise.reject(new Error('Runtime has been stopped'));
			if (starting) return starting;
			state = 'starting';
			// Defer invocation until the shared promise has been installed.
			starting = Promise.resolve().then(async () => {
				try {
					for (const step of steps) {
						if (stopRequested) break;
						const dispose = await step.start();
						if (typeof dispose !== 'function') throw new TypeError(`No disposer returned by ${step.name}`);
						resources.push({ name: step.name, dispose });
					}
					if (!stopRequested) state = 'ready';
				} catch (cause) {
					const cleanupErrors = await disposeResources();
					state = 'failed';
					if (cleanupErrors.length) throw new AggregateError([cause, ...cleanupErrors], 'Startup and rollback failed');
					throw cause;
				}
			});
			return starting;
		},
		stop(): Promise<void> {
			if (stopping) return stopping;
			stopRequested = true;
			stopping = Promise.resolve().then(async () => {
				// A pending acquisition must settle before its resources can be closed.
				try { await starting; } catch { /* start() reports the original failure. */ }
				state = 'stopping';
				const errors = await disposeResources();
				state = errors.length ? 'failed' : 'stopped';
				if (errors.length) throw new AggregateError(errors, 'Shutdown failed');
			});
			return stopping;
		},
	};
}
