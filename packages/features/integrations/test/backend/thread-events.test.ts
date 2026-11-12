/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, it, vi } from 'vitest';
import { NoteCreateService } from '@features/notes/backend/services/NoteCreateService.js';

it.each([true, false])('preserves thread-mute gating before mention/reply notifications: %s', async muted => {
	const exists = vi.fn(async () => muted); const push = vi.fn(); const publishMainStream = vi.fn(); const pack = vi.fn(async () => ({ id: 'note' }));
	const service = Object.assign(Object.create(NoteCreateService.prototype), {
		noteThreadMutingsRepository: { exists }, noteEntityService: { pack },
		globalEventService: { publishMainStream }, userEntityService: { isLocalUser: () => true },
	}) as NoteCreateService;
	const note = { id: 'note', threadId: 'thread', userId: 'recipient' };
	await service['createMentionedEvents']([{ id: 'recipient' }] as never, note as never, { push } as never);
	await service['createReplyEvent'](note as never, note as never, { push } as never);
	expect(exists).toHaveBeenCalledTimes(2);
	expect(exists).toHaveBeenCalledWith({ where: { userId: 'recipient', threadId: 'thread' } });
	if (muted) {
		expect(push).not.toHaveBeenCalled(); expect(publishMainStream).not.toHaveBeenCalled(); expect(pack).not.toHaveBeenCalled();
	} else {
		expect(push.mock.calls).toEqual([['recipient', 'mention'], ['recipient', 'reply']]);
	}
});
