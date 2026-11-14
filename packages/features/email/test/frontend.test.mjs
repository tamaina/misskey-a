/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { parse, compileScript, compileTemplate } = require('vue/compiler-sfc');
const ts = require('typescript');
const source = readFileSync(new URL('../frontend/components/MkMailbox.vue', import.meta.url), 'utf8');

test('mail SFCs compile without template or script syntax errors', () => {
	for (const name of ['components/MkMailbox.vue', 'components/mail-column.vue', 'pages/mail.vue']) {
		const content = readFileSync(new URL(`../frontend/${name}`, import.meta.url), 'utf8');
		const { descriptor, errors } = parse(content);
		assert.deepEqual(errors, []);
		compileScript(descriptor, { id: name });
		assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: name, id: name }).errors, []);
	}
});

test('received HTML and server preview stay inside opaque, scriptless frames', () => {
	const { descriptor } = parse(source);
	const frames = [...descriptor.template.content.matchAll(/<iframe\b[^>]*>/g)].map(x => x[0]);
	assert.equal(frames.length, 2);
	for (const frame of frames) {
		assert.match(frame, /sandbox=""/);
		assert.match(frame, /:srcdoc="isolatedMailDocument/);
		assert.match(frame, /referrerpolicy="no-referrer"/);
		assert.doesNotMatch(frame, /allow-scripts|allow-same-origin/);
	}
	assert.doesNotMatch(source, /v-html|localStorage|fetch\(/);
	assert.match(source, /misskeyApi\('email\/preview'/);
	assert.match(source, /idempotencyKey: lastSubmission.key/);
});

test('untrusted attachments download as octet-stream with sanitized names and revoked URLs', async () => {
	const downloadSource = readFileSync(new URL('../frontend/download.ts', import.meta.url), 'utf8');
	const output = ts.transpileModule(downloadSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
	const { downloadMailFile } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
	const saved = { window: globalThis.window, document: globalThis.document, timeout: globalThis.setTimeout, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
	let blob;
	let clicked = false;
	let revoked;
	const anchor = { click() { clicked = true; } };
	globalThis.document = { createElement: () => anchor };
	globalThis.window = globalThis;
	URL.createObjectURL = value => { blob = value; return 'blob:test'; };
	URL.revokeObjectURL = value => { revoked = value; };
	globalThis.setTimeout = callback => { callback(); return 0; };
	try {
		downloadMailFile({ data: Buffer.from('<script>bad()</script>').toString('base64'), filename: '../bad\\name.html', mimeType: 'text/html' });
		assert.equal(blob.type, 'application/octet-stream');
		assert.equal(await blob.text(), '<script>bad()</script>');
		assert.equal(anchor.download, '.._bad_name.html');
		assert.equal(anchor.href, 'blob:test');
		assert.equal(clicked, true);
		assert.equal(revoked, 'blob:test');
	} finally {
		globalThis.window = saved.window;
		globalThis.document = saved.document;
		globalThis.setTimeout = saved.timeout;
		URL.createObjectURL = saved.create;
		URL.revokeObjectURL = saved.revoke;
	}
});


test('CSP precedes attacker content and disables external resource loading', async () => {
	const htmlSource = readFileSync(new URL('../frontend/html.ts', import.meta.url), 'utf8');
	const output = ts.transpileModule(htmlSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
	const { isolatedMailDocument } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
	const document = isolatedMailDocument('<img src="https://tracker.invalid/pixel"><script>bad()</script>');
	assert.ok(document.indexOf('Content-Security-Policy') < document.indexOf('<img'));
	assert.match(document, /default-src 'none'/);
	assert.match(document, /img-src 'none'/);
	assert.match(document, /script-src 'none'/);
	assert.match(document, /style-src 'none'/);
});


test('generated MFM preview preserves inline CSS but denies all remote resource types', async () => {
	const htmlSource = readFileSync(new URL('../frontend/html.ts', import.meta.url), 'utf8');
	const output = ts.transpileModule(htmlSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
	const { isolatedMailDocument } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
	const css = '<style>@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s infinite; }</style><span class="spin">MFM</span>';
	const preview = isolatedMailDocument(css, 'preview');
	assert.match(preview, /style-src 'unsafe-inline'/);
	assert.ok(preview.includes(css));
	for (const directive of ['default-src', 'script-src', 'img-src', 'font-src', 'connect-src', 'media-src', 'object-src', 'frame-src', 'base-uri', 'form-action']) {
		assert.ok(preview.includes(`${directive} 'none'`));
	}
	assert.match(isolatedMailDocument(css), /style-src 'none'/);
	assert.match(source, /isolatedMailDocument\(selected.html\)/);
	assert.match(source, /isolatedMailDocument\(previewResult.html, 'preview'\)/);
});

test('forwarding query code survives one route remount, scoped to its window, without persistence', async () => {
	const codeSource = readFileSync(new URL('../frontend/confirmation.ts', import.meta.url), 'utf8');
	const output = ts.transpileModule(codeSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
	const { keepForwardingCode, takeForwardingCode } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
	const firstWindow = {};
	const secondWindow = {};
	keepForwardingCode(firstWindow, 'one-use-code');
	assert.equal(takeForwardingCode(secondWindow), '');
	assert.equal(takeForwardingCode(firstWindow), 'one-use-code');
	assert.equal(takeForwardingCode(firstWindow), '');
	const page = readFileSync(new URL('../frontend/pages/mail.vue', import.meta.url), 'utf8');
	assert.match(page, /router.replaceByPath\('\/my\/mail'\)/);
	assert.doesNotMatch(page + codeSource, /localStorage|sessionStorage|misskeyApi\(/);
	assert.match(source, /const confirmToken = ref\(props.verificationCode \?\? ''\)/);
});
