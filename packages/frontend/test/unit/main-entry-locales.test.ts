/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from 'vue';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createInternationalization, setActiveInternationalization, useLocale } from 'vite-vue-internationalization/runtime';
import type { InternationalizationInstance } from 'vite-vue-internationalization/runtime';

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>(done => { resolve = done; });
	return { promise, resolve };
}

async function prepare(path: string, language: string | null, load?: () => Promise<void>, bootError?: Error) {
	vi.resetModules();
	localStorage.clear();
	if (language !== null) localStorage.setItem('lang', language);
	window.history.replaceState(null, '', path);
	const evaluated: string[] = [];
	const labels: string[] = [];
	const installed: InternationalizationInstance[] = [];
	let runtime!: InternationalizationInstance;
	const create = vi.fn(({ initialLocale }: { initialLocale: string }) => {
		runtime = createInternationalization({
			primaryLocale: 'ja-JP',
			initialLocale,
			loaders: Object.fromEntries(['ja-JP', 'en-US', 'fr-FR'].map(locale => [locale, async () => {
				await load?.();
				return { global: { title: locale === 'ja-JP' ? '日本語の起動' : locale === 'fr-FR' ? 'Démarrage' : 'Startup' }, modules: {} };
			}])),
		});
		return runtime;
	});
	const activate = vi.fn(setActiveInternationalization);
	vi.doMock('virtual:vite-vue-internationalization', () => ({ createInternationalization: create, setActiveInternationalization: activate }));
	for (const kind of ['main', 'sub']) {
		vi.doMock(`@features/boot/frontend/boot/${kind}-boot.js`, () => {
			evaluated.push(kind);
			// This is intentionally eager: it must succeed before app.use().
			labels.push(String(useLocale(import.meta.url).value.env.title));
			return { [`${kind}Boot`]: async (received: InternationalizationInstance) => {
				if (bootError) throw bootError;
				expect(received).toBe(runtime);
				const app = createApp({});
				app.use(received);
				installed.push(received);
			} };
		});
	}
	return { create, activate, evaluated, labels, installed, start: () => import('../../src/_boot_.js') };
}

afterEach(() => {
	vi.doUnmock('virtual:vite-vue-internationalization');
	vi.doUnmock('@features/boot/frontend/boot/main-boot.js');
	vi.doUnmock('@features/boot/frontend/boot/sub-boot.js');
	localStorage.clear();
});

describe('main entry locale activation', () => {
	test.each([
		['fr-FR', 'ja-JP', 'fr-FR'],
		[null, 'ja-JP', 'ja-JP'],
		['unsupported', 'fr', 'fr-FR'],
		[null, 'unknown', 'en-US'],
	])('preserves loader language selection: persisted=%s browser=%s', (persisted, browser, expected) => {
		const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../public/loader/boot.js'), 'utf8');
		const start = source.indexOf('const supportedLangs = LANGS;');
		const end = source.indexOf('//#endregion', start);
		expect(start).toBeGreaterThan(0);
		expect(end).toBeGreaterThan(start);
		const values = new Map<string, string>();
		if (persisted !== null) values.set('lang', persisted);
		runInNewContext(source.slice(start, end), {
			LANGS: ['ja-JP', 'en-US', 'fr-FR'],
			navigator: { language: browser },
			localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) },
			console,
		});
		expect(values.get('lang')).toBe(expected);
	});

	test('waits for loading before evaluating eager translations and installs the same instance', async () => {
		const gate = deferred();
		const prepared = await prepare('/', 'ja-JP', () => gate.promise);
		const started = prepared.start();
		await vi.waitFor(() => expect(prepared.create).toHaveBeenCalledTimes(1));
		expect(prepared.activate).not.toHaveBeenCalled();
		expect(prepared.evaluated).toEqual([]);
		gate.resolve();
		await started;
		expect(prepared.labels).toEqual(['日本語の起動']);
		expect(prepared.activate).toHaveBeenCalledExactlyOnceWith(prepared.installed[0]);
	});

	test.each(['/share', '/auth', '/miauth', '/oauth', '/signup-complete', '/verify-email', '/install-extensions', '/auth/confirm'])('keeps sub-boot routing for %s', async path => {
		const prepared = await prepare(path, 'fr-FR');
		await prepared.start();
		expect(prepared.evaluated).toEqual(['sub']);
		expect(prepared.labels).toEqual(['Démarrage']);
	});

	test.each(['/', '/share-other', '/notes/test'])('keeps main routing and the default language for %s', async path => {
		const prepared = await prepare(path, null);
		await prepared.start();
		expect(prepared.create).toHaveBeenCalledExactlyOnceWith({ initialLocale: 'en-US' });
		expect(prepared.evaluated).toEqual(['main']);
		expect(prepared.labels).toEqual(['Startup']);
	});

	test('rejects loader failure even when runtime.ready swallows its initial rejection', async () => {
		const error = new Error('locale request failed');
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const prepared = await prepare('/', 'ja-JP', async () => { throw error; });
			await expect(prepared.start()).rejects.toBe(error);
			expect(prepared.activate).not.toHaveBeenCalled();
			expect(prepared.evaluated).toEqual([]);
			expect(prepared.installed).toEqual([]);
		} finally {
			consoleError.mockRestore();
		}
	});

	test('propagates boot failure to the importing loader', async () => {
		const error = new Error('boot failed');
		const prepared = await prepare('/', 'ja-JP', undefined, error);
		await expect(prepared.start()).rejects.toBe(error);
		expect(prepared.activate).toHaveBeenCalledTimes(1);
		expect(prepared.installed).toEqual([]);
	});

	test('creates independent runtimes for fresh entry evaluations', async () => {
		const first = await prepare('/', 'ja-JP');
		await first.start();
		const second = await prepare('/', 'fr-FR');
		await second.start();
		expect(first.installed[0]).not.toBe(second.installed[0]);
		expect(first.labels).toEqual(['日本語の起動']);
		expect(second.labels).toEqual(['Démarrage']);
	});
});
