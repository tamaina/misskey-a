import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchPilotResponse } from '../built/orpc-fetch.js';

test('old status/json injected fetch becomes a real JSON Response', async () => {
	let received;
	const response = await fetchPilotResponse(async (...args) => {
		received = args;
		return { status: 200, json: async () => ({ machine: '?' }) };
	}, new Request('https://example.com/api/server-info', {
		method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
	}));
	assert.deepEqual(await response.json(), { machine: '?' });
	assert.equal(received[0], 'https://example.com/api/server-info');
	assert.equal(received[1].body, '{}');
	assert.equal(received[1].credentials, 'omit');
	assert.equal(received[1].cache, 'no-cache');
});

test('204 does not read a nonexistent JSON body; native Responses retain real headers', async () => {
	const empty = await fetchPilotResponse(async () => ({ status: 204, json: () => { throw Error('must not read'); } }),
		new Request('https://example.com/api/notes/delete', { method: 'POST', body: '{}' }));
	assert.equal(empty.status, 204);
	assert.equal(await empty.text(), '');
	const expected = new Response('{}', { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '5' } });
	const actual = await fetchPilotResponse(async () => expected, new Request('https://example.com/api/server-info'));
	assert.equal(actual, expected);
	assert.equal(actual.headers.get('Retry-After'), '5');
});

test('multipart injected fetch receives FormData with a new boundary and intact file bytes', async () => {
	const form = new FormData();
	form.append('file', new File(['content'], 'image.png', { type: 'image/png' }));
	form.append('i', 'token');
	let received;
	await fetchPilotResponse(async (url, options) => {
		received = options;
		return { status: 200, json: async () => ({ id: 'file1' }) };
	}, new Request('https://example.com/api/drive/files/create', { method: 'POST', body: form }));
	assert.equal(received.headers['content-type'], undefined);
	assert.equal(received.body.get('i'), 'token');
	assert.equal(received.body.get('file').name, 'image.png');
	assert.equal(await received.body.get('file').text(), 'content');
});


test('oRPC cancellation reaches injected fetch and pre-aborted requests never start', async () => {
	const controller = new AbortController();
	const request = new Request('https://example.com/api/server-info', { signal: controller.signal });
	let signal;
	await fetchPilotResponse(async (_url, options) => {
		signal = options.signal;
		return new Response('{}');
	}, request);
	assert.equal(signal, request.signal);
	controller.abort();
	assert.equal(signal.aborted, true);
	await assert.rejects(fetchPilotResponse(async () => { throw Error('must not fetch'); }, request), { name: 'AbortError' });
});


test('JSON-only injected Responses decode as JSON even when headers default to text/plain', async () => {
	const original = new Response('{"id":"file1"}', { headers: { 'Retry-After': '5' } });
	const response = await fetchPilotResponse(async () => original, new Request('https://example.com/api/drive/files/create'));
	assert.equal(response.headers.get('content-type'), 'application/json');
	assert.equal(response.headers.get('Retry-After'), '5');
	assert.deepEqual(await response.json(), { id: 'file1' });
});
