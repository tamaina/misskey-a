/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { describe, expect, test, vi } from 'vitest';
import { startComponentLocales } from './index.js';

function deferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

describe('startComponentLocales', () => {
	test('waits for ready and the explicit locale load before installing', async () => {
		const locale = 'ja-JP';
		const ready = deferred<void>();
		const localeLoaded = deferred<void>();
		const runtime = {
			ready: ready.promise,
			loadLocale: vi.fn(() => localeLoaded.promise),
		};
		const create = vi.fn(() => runtime);
		const install = vi.fn();

		const started = startComponentLocales(locale, create, install);

		expect(create).toHaveBeenCalledTimes(1);
		expect(create).toHaveBeenCalledWith({ initialLocale: locale });
		expect(runtime.loadLocale).not.toHaveBeenCalled();
		expect(install).not.toHaveBeenCalled();

		ready.resolve(undefined);
		await Promise.resolve();
		expect(runtime.loadLocale).toHaveBeenCalledTimes(1);
		expect(runtime.loadLocale).toHaveBeenCalledWith(locale);
		expect(install).not.toHaveBeenCalled();

		localeLoaded.resolve(undefined);
		await expect(started).resolves.toBe(runtime);
		expect(install).toHaveBeenCalledTimes(1);
		expect(install).toHaveBeenCalledWith(runtime);
	});

	test('propagates ready rejection without loading or installing', async () => {
		const error = new Error('ready failed');
		const runtime = {
			ready: Promise.reject(error),
			loadLocale: vi.fn(),
		};
		const install = vi.fn();

		await expect(startComponentLocales('en-US', () => runtime, install)).rejects.toBe(error);
		expect(runtime.loadLocale).not.toHaveBeenCalled();
		expect(install).not.toHaveBeenCalled();
	});

	test('propagates explicit locale load rejection after ready succeeds', async () => {
		const error = new Error('locale load failed');
		const runtime = {
			ready: Promise.resolve(),
			loadLocale: vi.fn().mockRejectedValue(error),
		};
		const install = vi.fn();

		await expect(startComponentLocales('en-US', () => runtime, install)).rejects.toBe(error);
		expect(runtime.loadLocale).toHaveBeenCalledWith('en-US');
		expect(install).not.toHaveBeenCalled();
	});

	test('propagates a synchronous factory error without installing', async () => {
		const error = new Error('factory failed');
		const install = vi.fn();

		await expect(startComponentLocales('en-US', () => { throw error; }, install)).rejects.toBe(error);
		expect(install).not.toHaveBeenCalled();
	});

	test('keeps runtimes independent across calls', async () => {
		const locales = ['ja-JP', 'en-US'];
		const runtimes = locales.map(locale => ({
			locale,
			ready: Promise.resolve(),
			loadLocale: vi.fn().mockResolvedValue(undefined),
		}));
		const create = vi.fn(({ initialLocale }: { initialLocale: string }) => runtimes[locales.indexOf(initialLocale)]);
		const installed: typeof runtimes = [];

		const [first, second] = await Promise.all(locales.map(locale =>
			startComponentLocales(locale, create, runtime => installed.push(runtime)),
		));

		expect(create).toHaveBeenCalledTimes(2);
		expect(first).toBe(runtimes[0]);
		expect(second).toBe(runtimes[1]);
		expect(first).not.toBe(second);
		expect(installed).toEqual(runtimes);
		expect(runtimes[0].loadLocale).toHaveBeenCalledWith(locales[0]);
		expect(runtimes[1].loadLocale).toHaveBeenCalledWith(locales[1]);
	});
});
