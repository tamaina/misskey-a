/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { authenticateDialog, popups } from '@features/ui/frontend/os.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/ui/frontend/ts-messages.vue', () => ({ default: { $locale: {} } }));
vi.mock('@features/notes/frontend/components/MkPostFormDialog.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/components/MkWaitingDialog.vue', () => ({ default: {} }));
vi.mock('@features/pages/frontend/components/MkPageWindow.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/components/MkToast.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/components/MkDialog.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/components/MkPopupMenu.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/components/MkContextMenu.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/utility/copy-to-clipboard.js', () => ({ copyToClipboard: vi.fn() }));
vi.mock('@features/auth/frontend/utility/please-login.js', () => ({ pleaseLogin: vi.fn() }));
vi.mock('@features/users/frontend/utility/show-moved-dialog.js', () => ({ showMovedDialog: vi.fn() }));

afterEach(() => { popups.value = []; });

describe('authenticateDialog helper', () => {
	test('retains the existing no-argument credential dialog', async () => {
		const result = authenticateDialog();
		const popup = popups.value[0];
		expect(popup.props).toEqual({});
		popup.events.done({ password: 'synthetic-current', token: '123456' });
		popup.events.closed();
		expect(await result).toEqual({ canceled: false, result: { password: 'synthetic-current', token: '123456' } });
		await nextTick();
		expect(popups.value).toHaveLength(0);
	});

	test('passes a previously collected current password to the final MFA dialog', async () => {
		const result = authenticateDialog({ currentPassword: 'synthetic-current' });
		const popup = popups.value[0];
		expect(popup.props).toEqual({ currentPassword: 'synthetic-current' });
		popup.events.done({ password: 'synthetic-current', token: '654321' });
		expect(await result).toEqual({ canceled: false, result: { password: 'synthetic-current', token: '654321' } });
	});

	test.each(['cancelled', 'closed'])('settles on %s without waiting for a done event', async event => {
		const result = authenticateDialog({ currentPassword: 'synthetic-current' });
		popups.value[0].events[event]();
		expect(await result).toEqual({ canceled: true, result: undefined });
	});
});
