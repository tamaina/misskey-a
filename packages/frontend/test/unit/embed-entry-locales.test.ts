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
	vi.doMock('@features/boot/frontend/embed/boot.js', () => {
		evaluated.push('embed');
		labels.push(String(useLocale(import.meta.url).value.env.title));
		return { embedBoot: async (received: InternationalizationInstance) => {
			if (bootError) throw bootError;
			expect(received).toBe(runtime);
			const app = createApp({});
			app.use(received);
			installed.push(received);
		} };
	});

	// The embed package compiler checks its source graph separately.
	const entryPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../frontend-embed/src/boot.ts');
	return { create, activate, evaluated, labels, installed, start: () => import(entryPath) };
}

afterEach(() => {
	vi.doUnmock('virtual:vite-vue-internationalization');
	vi.doUnmock('@features/boot/frontend/embed/boot.js');
	localStorage.clear();
});

describe('embed entry locale activation', () => {
	test.each([
		['fr-FR', 'ja-JP', 'fr-FR'],
		[null, 'ja-JP', 'ja-JP'],
		['unsupported', 'fr', 'fr-FR'],
		[null, 'unknown', 'en-US'],
	])('preserves embed loader selection and saves it before module evaluation: %s / %s', async (persisted, browser, expected) => {
		const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../frontend-embed/public/loader/boot.js'), 'utf8');
		const values = new Map<string, string>();
		if (persisted !== null) values.set('lang', persisted);
		const imports: { target: string; language: string | undefined }[] = [];
		const document = { readyState: 'complete', documentElement: { classList: { add() {} } } };
		const context = {
			LANGS: ['ja-JP', 'en-US', 'fr-FR'], CLIENT_ENTRY: 'scripts/client.js',
			navigator: { language: browser }, location: { search: '' }, URLSearchParams,
			localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) },
			window: { document }, document, console,
			importEntry: async (target: string) => {
				// Native dynamic imports evaluate after the current synchronous turn.
				await Promise.resolve();
				imports.push({ target, language: values.get('lang') });
			},
		};
		expect(source.match(/await import\(/g)).toHaveLength(1);
		await runInNewContext(source.replace('await import(', 'await importEntry('), context);
		await Promise.resolve();
		expect(imports).toEqual([{ target: `/embed_vite/${expected}/client.js`, language: expected }]);
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

	test.each(['ja-JP', 'fr-FR', 'en-US', null])('uses the persisted locale or default for %s', async language => {
		const prepared = await prepare('/', language);
		await prepared.start();
		expect(prepared.create).toHaveBeenCalledExactlyOnceWith({ initialLocale: language ?? 'en-US' });
		expect(prepared.evaluated).toEqual(['embed']);
		expect(prepared.installed).toHaveLength(1);
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
