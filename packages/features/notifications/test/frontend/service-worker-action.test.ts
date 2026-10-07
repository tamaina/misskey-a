/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { runInNewContext } from 'node:vm';
import { expect, test, vi } from 'vitest';
import ts from 'typescript';
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
		'@/scripts/lang.js': {},
		'@/scripts/operations.js': { api, sendMarkAllAsRead: markRead },
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
