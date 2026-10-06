/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type Job<V> = {
	value: V;
	timer: NodeJS.Timeout;
};

// TODO: redis使えるようにする
export class CollapsedQueue<K, V> {
	private jobs: Map<K, Job<V>> = new Map();
	private running = new Set<Promise<void>>();

	constructor(
		private timeout: number,
		private collapse: (oldValue: V, newValue: V) => V,
		private perform: (key: K, value: V) => Promise<void>,
	) {}

	enqueue(key: K, value: V) {
		if (this.jobs.has(key)) {
			const old = this.jobs.get(key)!;
			const merged = this.collapse(old.value, value);
			this.jobs.set(key, { ...old, value: merged });
		} else {
			const timer = setTimeout(() => {
				const job = this.jobs.get(key)!;
				this.jobs.delete(key);
				void this.run(key, job.value).catch(error => console.error('Collapsed queue job failed:', error));
			}, this.timeout);
			this.jobs.set(key, { value, timer });
		}
	}

	private run(key: K, value: V): Promise<void> {
		const task = Promise.resolve().then(() => this.perform(key, value));
		this.running.add(task);
		void task.then(() => this.running.delete(task), () => this.running.delete(task));
		return task;
	}

	async performAllNow() {
		const entries = [...this.jobs.entries()];
		this.jobs.clear();
		for (const [_key, job] of entries) {
			clearTimeout(job.timer);
		}
		await Promise.allSettled([...this.running, ...entries.map(([key, job]) => this.run(key, job.value))]);
	}
}
