/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { runInNewContext } from 'node:vm';
import { expect, test, vi } from 'vitest';
import ts from 'typescript';
import workerSource from '../../../../sw/src/sw.ts?raw';

type FetchEvent = { request: Request; respondWith: (response: Promise<Response>) => void };

function loadWorker() {
	const share = vi.fn(async () => new Response(null, { status: 303 }));
	const network = vi.fn(async () => new Response('navigation'));
	const listeners = new Map<string, (event: FetchEvent) => void>();
	const collaborators: Record<string, unknown> = {
		'idb-keyval': {}, 'misskey-js': {},
		'@/const.js': { FETCH_TIMEOUT_MS: 1000 },
		'@/scripts/create-notification.js': {},
		'@/scripts/lang.js': {},
		'@/scripts/operations.js': {},
		'@/scripts/share.js': { respondToShare: share },
	};
	const compiled = ts.transpileModule(workerSource, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		reportDiagnostics: true,
	});
	expect(compiled.diagnostics).toEqual([]);
	runInNewContext(compiled.outputText, {
		exports: {}, _DEV_: false, URL, AbortController, setTimeout: window.setTimeout, clearTimeout: window.clearTimeout,
		location: { origin: 'https://a.test' }, fetch: network,
		addEventListener(name: string, listener: (event: FetchEvent) => void) { listeners.set(name, listener); },
		require(specifier: string) {
			if (!Object.hasOwn(collaborators, specifier)) throw new Error(`Unexpected dependency: ${specifier}`);
			return collaborators[specifier];
		},
	});
	const listener = listeners.get('fetch');
	if (!listener) throw new Error('Fetch listener unavailable');
	return { share, network, dispatch(request: Request) {
		let response: Promise<Response> | undefined;
		listener({ request, respondWith(value) { response = value; } });
		return response;
	} };
}

test('same-origin POST share wins over the navigation fallback', async () => {
	const worker = loadWorker();
	const request = new Request('https://a.test/sw/share', { method: 'POST', headers: { accept: 'text/html' } });
	const response = worker.dispatch(request);
	expect(response).toBeDefined();
	expect((await response)?.status).toBe(303);
	expect(worker.share).toHaveBeenCalledExactlyOnceWith(request);
	expect(worker.network).not.toHaveBeenCalled();
});

test.each([
	['https://b.test/sw/share', 'POST'],
	['https://a.test/sw/share', 'GET'],
	['https://a.test/sw/share/else', 'POST'],
])('share dispatch requires exact same-origin POST: %s %s', async (url, method) => {
	const worker = loadWorker();
	const response = worker.dispatch(new Request(url, { method, headers: { accept: 'text/html' } }));
	await response;
	expect(worker.share).not.toHaveBeenCalled();
	expect(worker.network).toHaveBeenCalledOnce();
});

test('two share events are handled independently and a worker restart still routes the next share', async () => {
	const worker = loadWorker();
	await Promise.all([worker.dispatch(new Request('https://a.test/sw/share', { method: 'POST' })), worker.dispatch(new Request('https://a.test/sw/share', { method: 'POST' }))]);
	expect(worker.share).toHaveBeenCalledTimes(2);
	const restarted = loadWorker();
	await restarted.dispatch(new Request('https://a.test/sw/share', { method: 'POST' }));
	expect(restarted.share).toHaveBeenCalledOnce();
});
