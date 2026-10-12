/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Security from '../../frontend/pages/settings/security.vue';
import * as os from '@features/ui/frontend/os.js';

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
	vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token: null } });
	vi.mocked(os.inputText).mockResolvedValue({ canceled: false, result: 'new-password' });
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
	app.unmount();
	element.remove();
});

function startChange() {
	const button = [...element.querySelectorAll('button')].find(item => item.textContent === 'Change password');
	expect(button).toBeDefined();
	button!.click();
}

describe('password-change dialogs', () => {
	test('waits for current credentials before asking for a new password', async () => {
		let finishAuthentication!: (value: Awaited<ReturnType<typeof os.authenticateDialog>>) => void;
		vi.mocked(os.authenticateDialog).mockReturnValue(new Promise(resolve => { finishAuthentication = resolve; }));
		startChange();
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
		expect(os.inputText).not.toHaveBeenCalled();
		finishAuthentication({ canceled: false, result: { password: 'current-password', token: null } });
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.inputText).toHaveBeenNthCalledWith(1, { title: 'New password', type: 'password', autocomplete: 'new-password' });
		expect(os.inputText).toHaveBeenNthCalledWith(2, { title: 'Retype new password', type: 'password', autocomplete: 'new-password' });
	});

	test.each([null, '123456', 'SYNTHETIC-BACKUP-CODE'])('preserves current credentials and 2FA token %s in the request', async token => {
		vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token } });
		startChange();
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.apiWithDialog).toHaveBeenCalledWith('i/change-password', {
			currentPassword: 'current-password', token, newPassword: 'new-password',
		});
		expect(os.alert).not.toHaveBeenCalled();
	});

	test('stops before new-password input when authentication is canceled', async () => {
		vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: true, result: undefined });
		startChange();
		await Promise.resolve();
		expect(os.inputText).not.toHaveBeenCalled();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
	});

	test.each([
		{ stage: 1, canceled: true, result: 'new-password' },
		{ stage: 1, canceled: false, result: null },
		{ stage: 2, canceled: true, result: 'new-password' },
		{ stage: 2, canceled: false, result: null },
	])('does not submit when stage $stage is canceled=$canceled or result=$result', async ({ stage, canceled, result }) => {
		if (stage === 2) vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'new-password' });
		vi.mocked(os.inputText).mockResolvedValueOnce({ canceled, result });
		startChange();
		// Drain the authentication and both input continuations before negative assertions.
		for (let i = 0; i < 4; i++) await Promise.resolve();
		expect(os.inputText).toHaveBeenCalledTimes(stage);
		expect(os.apiWithDialog).not.toHaveBeenCalled();
		expect(os.alert).not.toHaveBeenCalled();
	});

	test('reports a mismatch without sending a password-change request', async () => {
		vi.mocked(os.inputText)
			.mockResolvedValueOnce({ canceled: false, result: 'new-password' })
			.mockResolvedValueOnce({ canceled: false, result: 'different-password' });
		startChange();
		await vi.waitFor(() => expect(os.alert).toHaveBeenCalledWith({ type: 'error', text: 'The inputs do not match.' }));
		expect(os.apiWithDialog).not.toHaveBeenCalled();
	});
});
