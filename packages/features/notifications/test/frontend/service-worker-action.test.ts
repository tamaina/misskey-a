/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { runInNewContext } from 'node:vm';
import { expect, test, vi } from 'vitest';
import ts from 'typescript';
import notificationSource from '../../../../sw/src/scripts/create-notification.ts?raw';
import workerSource from '../../../../sw/src/sw.ts?raw';

type ClickEvent = {
	action: string;
	notification: { data: { type: string; userId: string; body: Record<string, unknown> }; close: () => void };
	waitUntil: (promise: Promise<void>) => void;
};

const app = { type: 'app', body: 'message', header: null, icon: null };

test.each([
	{ body: { type: 'follow', userId: 'notifier123' }, follows: true },
	{ body: { ...app, userId: undefined }, follows: false },
	{ body: JSON.parse(JSON.stringify({ ...app, userId: undefined })), follows: false },
	{ body: { ...app, userId: null }, follows: false },
	{ body: { ...app, userId: 7 }, follows: false },
])('actual service-worker follow action requires a string notifier ID: $body', async ({ body, follows }) => {
	const api = vi.fn(async () => undefined);
	const markRead = vi.fn(async () => undefined);
	const close = vi.fn();
	const listeners = new Map<string, (event: ClickEvent) => void>();
	const collaborators: Record<string, unknown> = {
		'idb-keyval': {},
		'misskey-js': {},
		'@/const.js': { FETCH_TIMEOUT_MS: 1000 },
		'@/scripts/create-notification.js': {},
		'@/scripts/get-account-from-id.js': {},
		'@/scripts/lang.js': {},
		'@/scripts/operations.js': { api, sendMarkAllAsRead: markRead },
		'@/scripts/share.js': {},
	};
	const compiled = ts.transpileModule(workerSource, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		reportDiagnostics: true,
	});
	expect(compiled.diagnostics).toEqual([]);
	runInNewContext(compiled.outputText, {
		exports: {},
		_DEV_: false,
		addEventListener(name: string, listener: (event: ClickEvent) => void) { listeners.set(name, listener); },
		require(specifier: string) {
			if (!Object.hasOwn(collaborators, specifier)) throw new Error(`Unexpected worker dependency: ${specifier}`);
			return collaborators[specifier];
		},
	});
	let finished: Promise<void> | undefined;
	const listener = listeners.get('notificationclick');
	if (!listener) throw new Error('Actual notificationclick listener was not registered');
	listener({
		action: 'follow',
		notification: { data: { type: 'notification', userId: 'account123', body }, close },
		waitUntil(promise) { finished = promise; },
	});
	expect(finished).toBeDefined();
	await finished;
	if (follows) expect(api).toHaveBeenCalledExactlyOnceWith('following/create', 'account123', { userId: 'notifier123' });
	else expect(api).not.toHaveBeenCalled();
	expect(markRead).toHaveBeenCalledExactlyOnceWith('account123');
	expect(close).toHaveBeenCalledOnce();
});

test('displays a private due reminder once across restarts and opens the matching local account', async () => {
	const saved = new Map<string, number>();
	const showNotification = vi.fn(async () => {});
	const openClient = vi.fn(async () => null);
	const getAccountFromId = vi.fn(async (id: string) => id === 'alice' ? { id } : undefined);
	function boot() {
		const listeners = new Map<string, (event: Record<string, unknown>) => void>();
		const modules: Record<string, unknown> = {
			'idb-keyval': { get: async (key: string) => saved.get(key), set: async (key: string, value: number) => saved.set(key, value) },
			'misskey-js': {}, '@/const.js': {}, '@/scripts/share.js': {}, '@/scripts/twemoji-base.js': {}, '@/scripts/get-user-name.js': {},
			'@/scripts/lang.js': { swLang: { lang: Promise.resolve('ja-JP') } },
			'@/scripts/get-account-from-id.js': { getAccountFromId },
			'@/scripts/operations.js': { openClient },
		};
		function evaluate(source: string) {
			const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
			const exports = {};
			runInNewContext(output.outputText, {
				exports, _DEV_: false, require: (name: string) => modules[name],
				registration: { showNotification }, clients: { matchAll: async () => [] },
				addEventListener: (name: string, listener: (event: Record<string, unknown>) => void) => listeners.set(name, listener),
			});
			return exports;
		}
		modules['@/scripts/create-notification.js'] = evaluate(notificationSource);
		evaluate(workerSource);
		return (name: string, event: Record<string, unknown>) => {
			let done: Promise<void> | undefined;
			listeners.get(name)?.({ ...event, waitUntil: (p: Promise<void>) => { done = p; } });
			if (!done) throw new Error('No handler for ' + name);
			return done;
		};
	}
	const data = { type: 'fukushuReminder', userId: 'alice', dateTime: Date.now(), body: { occurrence: Date.now(), expiresAt: Date.now() + 60_000 } };
	const push = { data: { json: () => data } };
	const event = boot();
	await Promise.all([event('push', push), event('push', push)]);
	const restarted = boot();
	await restarted('push', push);
	expect(showNotification).toHaveBeenCalledExactlyOnceWith('Fukushu', {
		body: '復習するカードがあります。', badge: '/static-assets/tabler-badges/bell.png',
		tag: `fukushu:alice:${data.body.occurrence}`, data,
	});
	const notification = { data, close: vi.fn() };
	await restarted('notificationclick', { notification });
	expect(openClient).toHaveBeenCalledExactlyOnceWith('push', '/fukushu', 'alice');
	getAccountFromId.mockResolvedValue(undefined);
	await restarted('notificationclick', { notification });
	expect(openClient).toHaveBeenCalledTimes(1);
	await restarted('push', { data: { json: () => ({ ...data, userId: 'bob' }) } });
	await restarted('push', { data: { json: () => ({ ...data, body: { occurrence: Date.now() + 1, expiresAt: 0 } }) } });
	expect(showNotification).toHaveBeenCalledTimes(1);
});
