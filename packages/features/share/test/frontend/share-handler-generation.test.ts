/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, expect, test, vi } from 'vitest';
import { getSharedFilesGeneration, saveSharedFiles } from '@@/js/shared-files.js';
import { respondToShare } from '../../../../sw/src/scripts/share.js';

vi.mock('@@/js/shared-files.js', () => ({ getSharedFilesGeneration: vi.fn(), saveSharedFiles: vi.fn() }));
const shareId = '01234567-89ab-cdef-0123-456789abcdef';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(done => { resolve = done; });
	return { promise, resolve };
}

function incoming() {
	return new Request('https://example.test/sw/share?shareId=sender-controlled', { method: 'POST' });
}

function fileForm() {
	const form = new FormData();
	form.append('files', new File(['synthetic'], 'shared.txt'));
	form.append('text', 'synthetic shared text');
	return form;
}

beforeEach(() => {
	vi.mocked(getSharedFilesGeneration).mockReset().mockResolvedValue('generation-a');
	vi.mocked(saveSharedFiles).mockReset().mockResolvedValue(shareId);
});

test('captures the generation before beginning body parsing and passes that snapshot to save', async () => {
	const generation = deferred<string>();
	vi.mocked(getSharedFilesGeneration).mockReturnValue(generation.promise);
	const request = incoming();
	const parse = vi.spyOn(request, 'formData').mockResolvedValue(fileForm());
	const pending = respondToShare(request);
	expect(getSharedFilesGeneration).toHaveBeenCalledOnce();
	expect(parse).not.toHaveBeenCalled();
	generation.resolve('generation-a');
	const response = await pending;
	expect(parse).toHaveBeenCalledOnce();
	expect(saveSharedFiles).toHaveBeenCalledWith(expect.any(Array), 'generation-a');
	expect(response.status).toBe(303);
});

test('two delayed old requests are canceled after a boundary while a new-generation share succeeds', async () => {
	let currentGeneration = 'generation-a';
	vi.mocked(getSharedFilesGeneration).mockImplementation(async () => currentGeneration);
	vi.mocked(saveSharedFiles).mockImplementation(async (_files, expected) => expected === currentGeneration ? shareId : null);
	const bodyA = deferred<FormData>();
	const bodyB = deferred<FormData>();
	const requestA = incoming();
	const requestB = incoming();
	const parseA = vi.spyOn(requestA, 'formData').mockReturnValue(bodyA.promise);
	const parseB = vi.spyOn(requestB, 'formData').mockReturnValue(bodyB.promise);
	const pendingA = respondToShare(requestA);
	const pendingB = respondToShare(requestB);
	await vi.waitFor(() => {
		expect(parseA).toHaveBeenCalledOnce();
		expect(parseB).toHaveBeenCalledOnce();
	});
	currentGeneration = 'generation-b';
	const newRequest = incoming();
	vi.spyOn(newRequest, 'formData').mockResolvedValue(fileForm());
	const fresh = await respondToShare(newRequest);
	expect(fresh.status).toBe(303);
	expect(new URL(fresh.headers.get('location')!).searchParams.get('shareId')).toBe(shareId);
	bodyB.resolve(fileForm());
	bodyA.resolve(fileForm());
	for (const response of await Promise.all([pendingA, pendingB])) {
		expect(response.status).toBe(409);
		expect(response.headers.has('location')).toBe(false);
		expect(await response.text()).toBe('Share canceled');
	}
	expect(vi.mocked(saveSharedFiles).mock.calls.map(([, generation]) => generation)).toEqual(['generation-b', 'generation-a', 'generation-a']);
});

test('body parsing failure does not attempt a file save', async () => {
	const error = new Error('synthetic invalid multipart body');
	const request = incoming();
	vi.spyOn(request, 'formData').mockRejectedValue(error);
	await expect(respondToShare(request)).rejects.toBe(error);
	expect(getSharedFilesGeneration).toHaveBeenCalledOnce();
	expect(saveSharedFiles).not.toHaveBeenCalled();
});

test('text-only sharing remains usable when generation storage fails', async () => {
	vi.mocked(getSharedFilesGeneration).mockRejectedValue(new Error('synthetic IndexedDB unavailable'));
	const request = incoming();
	const form = new FormData();
	form.append('text', 'synthetic text');
	vi.spyOn(request, 'formData').mockResolvedValue(form);
	const response = await respondToShare(request);
	expect(response.status).toBe(303);
	const url = new URL(response.headers.get('location')!);
	expect(url.searchParams.get('text')).toBe('synthetic text');
	expect(url.searchParams.has('shareId')).toBe(false);
	expect(saveSharedFiles).not.toHaveBeenCalled();
});

test('file sharing propagates the original generation error and never saves with a new snapshot', async () => {
	const error = new Error('synthetic IndexedDB unavailable');
	vi.mocked(getSharedFilesGeneration).mockRejectedValue(error);
	const request = incoming();
	vi.spyOn(request, 'formData').mockResolvedValue(fileForm());
	await expect(respondToShare(request)).rejects.toBe(error);
	expect(getSharedFilesGeneration).toHaveBeenCalledOnce();
	expect(saveSharedFiles).not.toHaveBeenCalled();
});
