/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, it, vi } from 'vitest';
import { confirmImageAltText, createPostPreparationGuard } from '@features/notes/frontend/utility/post-image-alt-reminder.js';

it.each([undefined, null, '', ' \t\n　'])('asks before posting an image with alt text %j', async comment => {
	const confirm = vi.fn().mockResolvedValue(false);
	expect(await confirmImageAltText(true, [{ type: 'image/png', comment }], confirm)).toBe(false);
	expect(confirm).toHaveBeenCalledOnce();
});

it('does not warn when disabled, images have descriptions, or the attachment is not an image', async () => {
	const confirm = vi.fn().mockResolvedValue(false);
	expect(await confirmImageAltText(false, [{ type: 'image/png', comment: null }], confirm)).toBe(true);
	expect(await confirmImageAltText(true, [
		{ type: 'image/gif', comment: ' Example of motion ' },
		{ type: 'audio/ogg', comment: null },
		{ type: 'video/mp4', comment: null },
		{ type: 'application/pdf', comment: null },
	], confirm)).toBe(true);
	expect(await confirmImageAltText(true, [], confirm)).toBe(true);
	expect(confirm).not.toHaveBeenCalled();
});

it('asks once for mixed attachments and lets the author deliberately proceed without alt text', async () => {
	const confirm = vi.fn().mockResolvedValue(true);
	expect(await confirmImageAltText(true, [
		{ type: 'image/jpeg', comment: 'described' },
		{ type: 'image/png', comment: null },
		{ type: 'image/gif', comment: '' },
	], confirm)).toBe(true);
	expect(confirm).toHaveBeenCalledOnce();
});

it('does not open a second dialog while preparing, and editing allows a later submission', async () => {
	const guard = createPostPreparationGuard();
	const decision = Promise.withResolvers<boolean>();
	const confirm = vi.fn()
		.mockReturnValueOnce(decision.promise)
		.mockResolvedValueOnce(true);
	const send = vi.fn();
	const submit = async () => {
		if (await confirmImageAltText(true, [{ type: 'image/png', comment: null }], confirm)) send();
	};

	const first = guard.run(submit);
	expect(guard.preparing.value).toBe(true);
	await guard.run(submit);
	expect(confirm).toHaveBeenCalledOnce();
	expect(send).not.toHaveBeenCalled();

	decision.resolve(false);
	await first;
	expect(guard.preparing.value).toBe(false);
	expect(send).not.toHaveBeenCalled();

	await guard.run(submit);
	expect(send).toHaveBeenCalledOnce();
	expect(guard.preparing.value).toBe(false);
});

it('releases the submit guard if preparation fails', async () => {
	const guard = createPostPreparationGuard();
	await expect(guard.run(async () => { throw new Error('preparation failed'); })).rejects.toThrow('preparation failed');
	expect(guard.preparing.value).toBe(false);
});
