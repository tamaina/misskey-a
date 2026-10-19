/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeEach, expect, test, vi } from 'vitest';
import { ownedAuthenticateDialog, ownedInputText } from '../../frontend/utility/owned-dialog.js';
const fixture = vi.hoisted(() => ({ dispose: vi.fn(), events: null as null | { done: (value: unknown) => void; closed: () => void; cancelled?: () => void } }));
vi.mock('@features/ui/frontend/components/MkDialog.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/os.js', () => ({ popup: vi.fn((_component, _props, events) => { fixture.events = events; return { dispose: fixture.dispose }; }) }));
import { popup } from '@features/ui/frontend/os.js';
beforeEach(() => { vi.clearAllMocks(); fixture.events = null; });
test('an already departed owner opens no password popup', async () => {
	const controller = new AbortController(); controller.abort();
	expect(await ownedInputText({ type: 'password' }, controller.signal)).toEqual({ canceled: true, result: undefined }); expect(popup).not.toHaveBeenCalled();
});
test('owner abort disposes the input immediately and rejects a late secret result', async () => {
	const controller = new AbortController(); const pending = ownedInputText({ type: 'password' }, controller.signal);
	controller.abort(); expect(fixture.dispose).toHaveBeenCalledOnce(); fixture.events!.done({ canceled: false, result: 'late-synthetic-secret' });
	expect(await pending).toEqual({ canceled: true, result: undefined });
});
test('accepted text disposes once and detaches later cancellation', async () => {
	const controller = new AbortController(); const pending = ownedInputText({ type: 'password' }, controller.signal);
	fixture.events!.done({ canceled: false, result: 'synthetic-secret' }); expect(await pending).toEqual({ canceled: false, result: 'synthetic-secret' });
	controller.abort(); fixture.events!.closed(); expect(fixture.dispose).toHaveBeenCalledOnce();
});
test('legacy authentication popup follows the same owner cancellation boundary', async () => {
	const controller = new AbortController(); const pending = ownedAuthenticateDialog({}, controller.signal);
	controller.abort(); fixture.events!.done({ password: 'late-synthetic-secret', token: '123456' });
	expect(await pending).toEqual({ canceled: true, result: undefined }); expect(fixture.dispose).toHaveBeenCalledOnce();
});
