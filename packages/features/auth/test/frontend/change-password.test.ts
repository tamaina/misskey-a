/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Security from '../../frontend/pages/settings/security.vue';
import * as os from '@features/ui/frontend/os.js';

const account = vi.hoisted(() => ({ twoFactorEnabled: true }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => account }));

vi.mock('@features/ui/frontend/os.js', () => ({
	authenticateDialog: vi.fn(),
	inputText: vi.fn(),
	alert: vi.fn(),
	apiWithDialog: vi.fn(),
}));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/ui/frontend/utility/paginator.js', () => ({ Paginator: class {} }));
vi.mock('@features/auth/frontend/pages/settings/2fa.vue', () => ({ default: defineComponent({ render: () => null }) }));
vi.mock('@features/ui/frontend/components/MkPagination.vue', () => ({ default: defineComponent({ render: () => null }) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }),
}));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) }),
}));
vi.mock('@features/ui/frontend/components/form/slot.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
}));
vi.mock('@features/web/frontend/components/MkFeatureBanner.vue', () => ({ default: defineComponent({ render: () => null }) }));

const internationalization = createInternationalization({ initialLocale: 'en-US' });
let app: ReturnType<typeof createApp>;
let element: HTMLDivElement;

beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
});

beforeEach(() => {
	vi.resetAllMocks();
	account.twoFactorEnabled = true;
	vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token: null } });
	vi.mocked(os.inputText)
		.mockResolvedValueOnce({ canceled: false, result: 'current-password' })
		.mockResolvedValue({ canceled: false, result: 'new-password' });
	element = window.document.createElement('div');
	app = createApp(Security);
	app.use(internationalization);
	const slot = defineComponent({ inheritAttrs: false, setup: (_, { slots }) => () => h('div', slots.default?.()) });
	for (const name of ['SearchMarker', 'SearchLabel', 'SearchText']) app.component(name, slot);
	app.component('MkTime', defineComponent({ render: () => null }));
	app.directive('panel', {});
	app.mount(element);
});

afterEach(() => {
	vi.useRealTimers();
	app.unmount();
	element.remove();
});

function startChange() {
	const button = [...element.querySelectorAll('button')].find(item => item.textContent === 'Change password');
	expect(button).toBeDefined();
	button!.click();
}

describe('password-change dialogs', () => {
	test('collects the current password before either new-password input and MFA', async () => {
		let finishCurrentPassword!: (value: Awaited<ReturnType<typeof os.inputText>>) => void;
		vi.mocked(os.inputText).mockReset()
			.mockReturnValueOnce(new Promise(resolve => { finishCurrentPassword = resolve; }))
			.mockResolvedValue({ canceled: false, result: 'new-password' });
		startChange();
		expect(os.inputText).toHaveBeenCalledOnce();
		expect(os.inputText).toHaveBeenNthCalledWith(1, { title: 'Password', type: 'password', autocomplete: 'current-password', minLength: 1 });
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		finishCurrentPassword({ canceled: false, result: 'current-password' });
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.inputText).toHaveBeenNthCalledWith(2, { title: 'New password', type: 'password', autocomplete: 'new-password' });
		expect(os.inputText).toHaveBeenNthCalledWith(3, { title: 'Retype new password', type: 'password', autocomplete: 'new-password' });
		expect(os.authenticateDialog).toHaveBeenCalledWith({ currentPassword: 'current-password' });
	});

	test('collects a fresh MFA token only after two minutes of new-password entry', async () => {
		vi.useFakeTimers();
		const startedAt = Date.now();
		let authenticationRequestedAt: number | null = null;
		let finishNewPassword!: (value: Awaited<ReturnType<typeof os.inputText>>) => void;
		vi.mocked(os.inputText).mockReset()
			.mockResolvedValueOnce({ canceled: false, result: 'current-password' })
			.mockReturnValueOnce(new Promise(resolve => { finishNewPassword = resolve; }))
			.mockResolvedValueOnce({ canceled: false, result: 'new-password' });
		vi.mocked(os.authenticateDialog).mockImplementation(async () => {
			authenticationRequestedAt = Date.now();
			return { canceled: false, result: { password: 'current-password', token: '654321' } };
		});
		startChange();
		await vi.advanceTimersByTimeAsync(120000);
		expect(os.inputText).toHaveBeenCalledTimes(2);
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
		finishNewPassword({ canceled: false, result: 'new-password' });
		await vi.advanceTimersByTimeAsync(0);
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
		expect(authenticationRequestedAt).toBe(startedAt + 120000);
		expect(os.apiWithDialog).toHaveBeenCalledWith('i/change-password', {
			currentPassword: 'current-password', token: '654321', newPassword: 'new-password',
		});
	});

	test.each(['123456', 'SYNTHETIC-BACKUP-CODE'])('preserves current credentials and 2FA token %s in the request', async token => {
		vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token } });
		startChange();
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.apiWithDialog).toHaveBeenCalledWith('i/change-password', {
			currentPassword: 'current-password', token, newPassword: 'new-password',
		});
		expect(os.alert).not.toHaveBeenCalled();
	});

	test('submits without an MFA dialog when two-factor authentication is disabled', async () => {
		account.twoFactorEnabled = false;
		startChange();
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).toHaveBeenCalledWith('i/change-password', {
			currentPassword: 'current-password', token: null, newPassword: 'new-password',
		});
	});

	test('does not submit when the final MFA dialog is canceled', async () => {
		vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: true, result: undefined });
		startChange();
		for (let i = 0; i < 5; i++) await Promise.resolve();
		expect(os.inputText).toHaveBeenCalledTimes(3);
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
	});

	test.each([
		{ stage: 1, canceled: true, result: 'current-password' },
		{ stage: 1, canceled: false, result: null },
		{ stage: 1, canceled: false, result: '' },
		{ stage: 2, canceled: true, result: 'new-password' },
		{ stage: 2, canceled: false, result: null },
		{ stage: 3, canceled: true, result: 'new-password' },
		{ stage: 3, canceled: false, result: null },
	])('stops at stage $stage on canceled=$canceled or result=$result', async ({ stage, canceled, result }) => {
		vi.mocked(os.inputText).mockReset();
		if (stage > 1) vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'current-password' });
		if (stage > 2) vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'new-password' });
		vi.mocked(os.inputText).mockResolvedValueOnce(canceled ? { canceled: true, result: undefined } : { canceled: false, result });
		startChange();
		for (let i = 0; i < 5; i++) await Promise.resolve();
		expect(os.inputText).toHaveBeenCalledTimes(stage);
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
		expect(os.alert).not.toHaveBeenCalled();
	});

	test('reports a mismatch before requesting MFA or submitting', async () => {
		vi.mocked(os.inputText).mockReset()
			.mockResolvedValueOnce({ canceled: false, result: 'current-password' })
			.mockResolvedValueOnce({ canceled: false, result: 'new-password' })
			.mockResolvedValueOnce({ canceled: false, result: 'different-password' });
		startChange();
		await vi.waitFor(() => expect(os.alert).toHaveBeenCalledWith({ type: 'error', text: 'The inputs do not match.' }));
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
	});
});
