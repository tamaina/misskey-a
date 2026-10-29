/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

let server: Server;
let foreignServer: Server;
let origin: string;
let foreignOrigin: string;

async function listen(instance: Server) {
	await new Promise<void>(done => instance.listen(0, '127.0.0.1', done));
	return `http://127.0.0.1:${(instance.address() as AddressInfo).port}`;
}

test.beforeAll(async () => {
	const worker = await readFile(resolve(import.meta.dirname, '../../../../built/_sw_dist_/sw.js'));
	const client = await build({
		entryPoints: [resolve(import.meta.dirname, '../../../frontend-shared/js/shared-files.ts')],
		bundle: true, format: 'esm', write: false,
	});
	const handler = await build({
		entryPoints: [resolve(import.meta.dirname, '../../../sw/src/scripts/share.ts')],
		bundle: true, format: 'esm', write: false,
		tsconfig: resolve(import.meta.dirname, '../../../sw/tsconfig.json'),
	});
	server = createServer((req, res) => {
		const path = req.url?.split('?')[0];
		res.setHeader('content-type', path?.endsWith('.js') ? 'text/javascript' : 'text/html');
		res.end(path === '/sw.js' ? worker : path === '/shared-files.js' ? client.outputFiles[0].text
			: path === '/share-handler.js' ? handler.outputFiles[0].text
			: '<!doctype html><form action="/sw/share" method="post" enctype="multipart/form-data"><input type="file" name="files"><input name="text" value="Shared text"><button>Share</button></form>');
	});
	origin = await listen(server);
	foreignServer = createServer((_req, res) => {
		res.setHeader('content-type', 'text/html');
		res.end(`<!doctype html><form action="${origin}/sw/share" method="post" enctype="multipart/form-data"><input name="text" value="Foreign"><button>Share</button></form>`);
	});
	foreignOrigin = await listen(foreignServer);
});

test.afterAll(async () => {
	await Promise.all([server, foreignServer].filter(Boolean).map(instance => new Promise<void>(done => instance.close(() => done()))));
});

async function read(page: Page, id: string | null, accountId: string) {
	return await page.evaluate(async ({ origin, id, accountId }) => {
		const shared = await import(`${origin}/shared-files.js`);
		const files: File[] = await shared.readSharedFiles(id, accountId);
		return await Promise.all(files.map(async file => ({ name: file.name, text: await file.text() })));
	}, { origin, id, accountId });
}

test('shared drafts remain isolated across requests and accounts', async ({ page, context }) => {
	await page.goto(origin);
	await page.evaluate(async () => {
		await navigator.serviceWorker.register('/sw.js', { type: 'classic' });
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) await new Promise<void>(done => navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true }));
	});
	const second = await context.newPage();
	await second.goto(origin);
	await page.locator('input[type=file]').setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('A') });
	await second.locator('input[type=file]').setInputFiles({ name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('B') });
	await Promise.all([page.waitForURL('**/share?**'), second.waitForURL('**/share?**'), page.locator('button').click(), second.locator('button').click()]);
	const firstId = new URL(page.url()).searchParams.get('shareId');
	const secondId = new URL(second.url()).searchParams.get('shareId');
	expect(firstId).toBeTruthy();
	expect(secondId).not.toBe(firstId);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);
	expect(await read(second, secondId, 'B')).toEqual([{ name: 'b.txt', text: 'B' }]);
	expect(await read(second, firstId, 'B')).toEqual([]);
	expect(await read(second, null, 'B')).toEqual([]);
	await page.reload();
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);
	const unclaimedId = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		return await shared.saveSharedFiles([new File(['claim'], 'claim.txt')]);
	}, origin);
	const claims = await Promise.all([read(page, unclaimedId, 'A'), read(second, unclaimedId, 'B')]);
	expect(claims.filter(files => files.length !== 0)).toHaveLength(1);

	const third = await context.newPage();
	await third.goto(origin);
	await third.locator('input[type=file]').evaluate(element => element.remove());
	await Promise.all([third.waitForURL('**/share?**'), third.locator('button').click()]);
	expect(await read(third, new URL(third.url()).searchParams.get('shareId'), 'A')).toEqual([]);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);
	await second.evaluate(async ({ origin, secondId }) => {
		const shared = await import(`${origin}/shared-files.js`);
		await shared.discardSharedFiles(secondId, 'B');
	}, { origin, secondId });
	expect(await read(second, secondId, 'B')).toEqual([]);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);

	await third.goto(foreignOrigin);
	const rejected = third.waitForResponse(response => response.url() === `${origin}/sw/share` && response.request().method() === 'POST');
	await third.locator('button').click();
	expect((await rejected).status()).toBe(403);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);

	const countRecords = () => page.evaluate(() => new Promise<number>((done, reject) => {
		const open = indexedDB.open('misskey-shared-files');
		open.onerror = () => reject(open.error);
		open.onsuccess = () => {
			const db = open.result;
			const count = db.transaction('shares').objectStore('shares').getAllKeys();
			count.onerror = () => { db.close(); reject(count.error); };
			count.onsuccess = () => { db.close(); done(count.result.filter(key => typeof key === 'string' && /^[0-9a-f]{8}-/.test(key)).length); };
		};
	}));
	const pendingCount = await countRecords();
	for (let i = 0; i < 3; i++) {
		const opaque = await context.newPage();
		await opaque.goto(origin);
		const target = `${origin}/sw/share?shareId=${firstId}`;
		await opaque.evaluate(({ target, firstId }) => {
			const iframe = document.createElement('iframe');
			iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-top-navigation');
			iframe.srcdoc = `<form action="${target}" method="post" enctype="multipart/form-data" target="_top"><input name="shareId" value="${firstId}"><button>Share</button></form>`;
			document.body.append(iframe);
		}, { target, firstId });
		const submitted = opaque.waitForRequest(request => request.url() === target && request.method() === 'POST');
		await Promise.all([opaque.waitForURL(`${origin}/share`), opaque.frameLocator('iframe').locator('button').click()]);
		expect((await submitted).headers().origin).toBe('null');
		expect(new URL(opaque.url()).searchParams.has('shareId')).toBe(false);
		await opaque.close();
	}
	expect(await countRecords()).toBe(pendingCount);
	expect(await read(page, firstId, 'A')).toEqual([{ name: 'a.txt', text: 'A' }]);

	await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const now = Date.now;
		Date.now = () => now() + 2 * 60 * 60 * 1000;
		try { await shared.cleanupSharedFiles(); } finally { Date.now = now; }
	}, origin);
	expect(await read(page, firstId, 'A')).toEqual([]);
	const capacity = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const attempts = await Promise.allSettled(Array.from({ length: 40 }, () => shared.saveSharedFiles([new File(['x'], 'x.txt')])));
		return { saved: attempts.filter(result => result.status === 'fulfilled').length, rejected: attempts.filter(result => result.status === 'rejected').length };
	}, origin);
	expect(capacity).toEqual({ saved: 32, rejected: 8 });
	expect(await countRecords()).toBe(32);
});

test('account cleanup clears claimed and unclaimed drafts across browser contexts', async ({ page, context }) => {
	await page.goto(origin);
	const ids = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const ids: string[] = [];
		for (const name of ['A', 'B', 'unclaimed']) ids.push(await shared.saveSharedFiles([new File([name], `${name}.txt`)]));
		await shared.readSharedFiles(ids[0], 'A');
		await shared.readSharedFiles(ids[1], 'B');
		return ids;
	}, origin);
	const second = await context.newPage();
	await second.goto(origin);
	await second.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		await shared.clearSharedFiles();
	}, origin);
	for (const id of ids) {
		expect(await read(page, id, 'A')).toEqual([]);
		expect(await read(second, id, 'B')).toEqual([]);
	}
	// Recreate the document/module: cleared records do not return after restart.
	await page.reload();
	for (const id of ids) expect(await read(page, id, 'A')).toEqual([]);
	const newId = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		return await shared.saveSharedFiles([new File(['new'], 'new.txt')]);
	}, origin);
	expect(await read(page, newId, 'B')).toEqual([{ name: 'new.txt', text: 'new' }]);
	await second.close();
});

test('clear serializes with an already-started claim without restoring the record', async ({ page }) => {
	await page.goto(origin);
	const result = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const id = await shared.saveSharedFiles([new File(['pending'], 'pending.txt')]);
		const pendingRead = shared.readSharedFiles(id, 'A');
		await shared.clearSharedFiles();
		await pendingRead;
		return {
			first: (await shared.readSharedFiles(id, 'A')).length,
			second: (await shared.readSharedFiles(id, 'B')).length,
		};
	}, origin);
	expect(result).toEqual({ first: 0, second: 0 });
});

test('a stopped service worker restarts for another share and retains the previous draft', async ({ page, context }) => {
	await page.goto(origin);
	await page.evaluate(async () => {
		await navigator.serviceWorker.register('/sw.js', { type: 'classic' });
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) await new Promise<void>(done => navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true }));
	});
	await page.locator('input[type=file]').setInputFiles({ name: 'before.txt', mimeType: 'text/plain', buffer: Buffer.from('before') });
	await Promise.all([page.waitForURL('**/share?**'), page.locator('button').click()]);
	const oldId = new URL(page.url()).searchParams.get('shareId');
	expect(await read(page, oldId, 'A')).toEqual([{ name: 'before.txt', text: 'before' }]);
	const session = await context.newCDPSession(page);
	await session.send('ServiceWorker.enable');
	await session.send('ServiceWorker.stopAllWorkers');
	await page.locator('input[type=file]').setInputFiles({ name: 'after.txt', mimeType: 'text/plain', buffer: Buffer.from('after') });
	await Promise.all([page.waitForURL(url => url.searchParams.get('shareId') !== oldId), page.locator('button').click()]);
	const newId = new URL(page.url()).searchParams.get('shareId');
	expect(newId).not.toBe(oldId);
	expect(await read(page, newId, 'A')).toEqual([{ name: 'after.txt', text: 'after' }]);
	expect(await read(page, oldId, 'A')).toEqual([{ name: 'before.txt', text: 'before' }]);
	await session.detach();
});

test('an old-account share waiting on its body does not reappear after account cleanup', async ({ page, context }) => {
	await page.goto(origin);
	const other = await context.newPage();
	await other.goto(origin);
	await page.evaluate(async origin => {
		const handler = await import(`${origin}/share-handler.js`);
		const shared = await import(`${origin}/shared-files.js`);
		const body = new FormData();
		body.append('files', new File(['old-account-secret'], 'old.txt'));
		let release!: (body: FormData) => void;
		const delayed = new Promise<FormData>(resolve => { release = resolve; });
		let entered!: () => void;
		const bodyStarted = new Promise<void>(resolve => { entered = resolve; });
		const request = new Request(`${origin}/sw/share`, { method: 'POST', body });
		Object.defineProperty(request, 'formData', { value: () => { entered(); return delayed; } });
		// Invoke the actual handler before account A switches; body parsing remains pending.
		const response = handler.respondToShare(request);
		await bodyStarted;
		Object.defineProperty(window, '__finishOldShare', { configurable: true, value: async () => {
			release(body);
			const result: Response = await response;
			const location = result.headers.get('location');
			const id = location ? new URL(location).searchParams.get('shareId') : null;
			const files: File[] = await shared.readSharedFiles(id, 'B');
			return { status: result.status, location, contents: await Promise.all(files.map(file => file.text())) };
		} });
	}, origin);
	// The real account-boundary helper completes in a different page before body release.
	await other.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		await shared.clearSharedFiles();
	}, origin);
	const visibleToNewAccount = await page.evaluate(async () => {
		const finish = Reflect.get(window, '__finishOldShare') as () => Promise<{ status: number; location: string | null; contents: string[] }>;
		return finish();
	});
	expect(visibleToNewAccount).toEqual({ status: 409, location: null, contents: [] });
	await other.close();
});

test('a fresh share beginning after account cleanup can be claimed by the new account', async ({ page }) => {
	await page.goto(origin);
	const files = await page.evaluate(async origin => {
		const handler = await import(`${origin}/share-handler.js`);
		const shared = await import(`${origin}/shared-files.js`);
		await shared.clearSharedFiles();
		const body = new FormData();
		body.append('files', new File(['new-share'], 'new.txt'));
		const response: Response = await handler.respondToShare(new Request(`${origin}/sw/share`, { method: 'POST', body }));
		const id = new URL(response.headers.get('location')!).searchParams.get('shareId');
		const files: File[] = await shared.readSharedFiles(id, 'B');
		return Promise.all(files.map(file => file.text()));
	}, origin);
	expect(files).toEqual(['new-share']);
});

test('generation survives reload and TTL cleanup and never resets on repeated clear', async ({ page }) => {
	await page.goto(origin);
	const before = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const old = await shared.getSharedFilesGeneration();
		await shared.clearSharedFiles();
		const current = await shared.getSharedFilesGeneration();
		return { old, current };
	}, origin);
	expect(before.current).not.toBe(before.old);
	await page.reload();
	const after = await page.evaluate(async ({ origin, before }) => {
		const shared = await import(`${origin}/shared-files.js?restart=1`);
		const now = Date.now;
		Date.now = () => now() + 2 * 60 * 60 * 1000;
		try { await shared.cleanupSharedFiles(); } finally { Date.now = now; }
		const current = await shared.getSharedFilesGeneration();
		const stale = await shared.saveSharedFiles([new File(['stale'], 'stale.txt')], before.old);
		await shared.clearSharedFiles();
		const next = await shared.getSharedFilesGeneration();
		const alsoStale = await shared.saveSharedFiles([new File(['stale'], 'stale.txt')], before.current);
		return { current, stale, next, alsoStale };
	}, { origin, before });
	expect(after.current).toBe(before.current);
	expect(after.stale).toBeNull();
	expect(after.alsoStale).toBeNull();
	expect(after.next).not.toBe(before.old);
	expect(after.next).not.toBe(before.current);
});

test('concurrent saves racing account cleanup cannot leave old-generation records', async ({ page }) => {
	await page.goto(origin);
	const result = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const old = await shared.getSharedFilesGeneration();
		const pending: Promise<string | null>[] = Array.from({ length: 8 }, (_, i) => shared.saveSharedFiles([new File([`old${i}`], `old${i}.txt`)], old));
		await shared.clearSharedFiles();
		const ids = await Promise.all(pending);
		const contents = await Promise.all(ids.map(async id => {
			const files: File[] = await shared.readSharedFiles(id, 'new-account');
			return files.length;
		}));
		const fresh = await shared.saveSharedFiles([new File(['fresh'], 'fresh.txt')]);
		const freshFiles: File[] = await shared.readSharedFiles(fresh, 'new-account');
		return { contents, fresh: await Promise.all(freshFiles.map(file => file.text())) };
	}, origin);
	expect(result.contents).toEqual(Array(8).fill(0));
	expect(result.fresh).toEqual(['fresh']);
});

test('discard and expired-record cleanup retain the current generation', async ({ page }) => {
	await page.goto(origin);
	const result = await page.evaluate(async origin => {
		const shared = await import(`${origin}/shared-files.js`);
		const generation = await shared.getSharedFilesGeneration();
		const id = await shared.saveSharedFiles([new File(['cancel'], 'cancel.txt')], generation);
		await shared.readSharedFiles(id, 'A');
		await shared.discardSharedFiles(id, 'A');
		const canceled: File[] = await shared.readSharedFiles(id, 'A');
		const expiring = await shared.saveSharedFiles([new File(['expire'], 'expire.txt')], generation);
		const now = Date.now;
		Date.now = () => now() + 2 * 60 * 60 * 1000;
		try { await shared.cleanupSharedFiles(); } finally { Date.now = now; }
		const expired: File[] = await shared.readSharedFiles(expiring, 'A');
		return { generation, current: await shared.getSharedFilesGeneration(), canceled: canceled.length, expired: expired.length };
	}, origin);
	expect(result.current).toBe(result.generation);
	expect(result.canceled).toBe(0);
	expect(result.expired).toBe(0);
});
