/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { runInNewContext } from 'node:vm';
import { expect, test, vi } from 'vitest';
import ts from 'typescript';
import shareSource from '../../frontend/pages/share.vue?raw';

type Ref<T> = { value: T };
type PageState = { state: Ref<string>; tempFiles: Ref<File[]>; close: () => Promise<void>; goToMisskey: () => Promise<void> };

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(done => { resolve = done; });
	return { promise, resolve };
}

function startPage(read: Promise<File[]>) {
	const account = { $i: { id: 'account-a' } };
	const unmount: (() => void)[] = [];
	const deactivate: (() => void)[] = [];
	const discard = vi.fn(async (): Promise<void> => undefined);
	const alert = vi.fn();
	const exports: { page?: PageState } = {};
	const collaborators: Record<string, unknown> = {
		'vue': { ref: (value: unknown) => ({ value }), computed: (get: () => unknown) => ({ get value() { return get(); } }), onBeforeUnmount: (callback: () => void) => unmount.push(callback), onDeactivated: (callback: () => void) => deactivate.push(callback) },
		'misskey-js': { noteVisibilities: ['public', 'home', 'followers', 'specified'] },
		'@@/js/shared-files.js': { readSharedFiles: vi.fn(() => read), discardSharedFiles: discard },
		'@features/auth/frontend/i.js': account,
		'@features/ui/frontend/components/MkButton.vue': {},
		'@features/notes/frontend/components/MkPostForm.vue': {},
		'@features/ui/frontend/os.js': { alert },
		'@features/api/frontend/utility/misskey-api.js': { misskeyApi: vi.fn(async () => undefined) },
		'@features/navigation/frontend/page.js': { definePage: vi.fn() },
		'@features/web/frontend/utility/post-message.js': { postMessageToParentWindow: vi.fn() },
	};
	const script = shareSource.match(/<script lang="ts" setup>([\s\S]*?)<\/script>/)?.[1];
	if (!script) throw new Error('Share page script not found');
	const compiled = ts.transpileModule(`${script}\nexports.page = { state, tempFiles, close, goToMisskey };`, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		reportDiagnostics: true,
	});
	expect(compiled.diagnostics).toEqual([]);
	const window = { location: { search: '?shareId=01234567-89ab-cdef-0123-456789abcdef', hash: '', href: '/share' }, indexedDB: {}, close: vi.fn(), setTimeout: vi.fn(), fetch: vi.fn() };
	runInNewContext(compiled.outputText, {
		exports, window, URL, URLSearchParams, Blob, File, console,
		$locale: { value: { sfc: { error: 'Error', close: 'Close', goToMisskey: 'Home', menu: 'Menu', share: 'Share' } } },
		require(specifier: string) {
			if (!Object.hasOwn(collaborators, specifier)) throw new Error(`Unexpected page dependency: ${specifier}`);
			return collaborators[specifier];
		},
	});
	if (!exports.page) throw new Error('Share state unavailable');
	return { page: exports.page, account, discard, alert, window, unmount: () => unmount.forEach(callback => callback()), deactivate: () => deactivate.forEach(callback => callback()) };
}

async function settle() {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

test('a successful read exposes local files to the live share form', async () => {
	const read = deferred<File[]>();
	const page = startPage(read.promise);
	const file = new File(['synthetic'], 'shared.txt');
	read.resolve([file]);
	await settle();
	expect(page.page.tempFiles.value).toEqual([file]);
	expect(page.page.state.value).toBe('writing');
});

test('unmount during a pending read never recreates a share form or retains files', async () => {
	const read = deferred<File[]>();
	const page = startPage(read.promise);
	page.unmount();
	read.resolve([new File(['synthetic'], 'shared.txt')]);
	await settle();
	expect(page.page.tempFiles.value).toEqual([]);
	expect(page.page.state.value).not.toBe('writing');
	expect(page.discard).toHaveBeenCalledWith('01234567-89ab-cdef-0123-456789abcdef', 'account-a');
});

test('a pending read cannot attach account A files after switching to account B', async () => {
	const read = deferred<File[]>();
	const page = startPage(read.promise);
	page.account.$i = { id: 'account-b' };
	read.resolve([new File(['synthetic'], 'shared.txt')]);
	await settle();
	expect(page.page.tempFiles.value).toEqual([]);
	expect(page.page.state.value).not.toBe('writing');
});

test.each(['close', 'goToMisskey'] as const)('cancel via %s invalidates a pending read before storage cleanup resolves', async action => {
	const read = deferred<File[]>();
	const cleanup = deferred<void>();
	const page = startPage(read.promise);
	page.discard.mockImplementation(() => cleanup.promise);
	const canceled = page.page[action]();
	read.resolve([new File(['synthetic'], 'shared.txt')]);
	await settle();
	const staleFiles = [...page.page.tempFiles.value];
	const state = page.page.state.value;
	cleanup.resolve();
	await canceled;
	expect(staleFiles).toEqual([]);
	expect(state).not.toBe('writing');
});

test('KeepAlive deactivation cancels a pending read and discards the share', async () => {
	const read = deferred<File[]>();
	const page = startPage(read.promise);
	page.deactivate();
	read.resolve([new File(['synthetic'], 'shared.txt')]);
	await settle();
	expect(page.page.tempFiles.value).toEqual([]);
	expect(page.page.state.value).not.toBe('writing');
	expect(page.discard).toHaveBeenCalledWith('01234567-89ab-cdef-0123-456789abcdef', 'account-a');
});
