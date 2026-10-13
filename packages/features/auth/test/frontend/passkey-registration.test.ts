/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { startRegistration } from '@simplewebauthn/browser';
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import Settings from '../../frontend/pages/settings/2fa.vue';
import * as os from '@features/ui/frontend/os.js';

const account = vi.hoisted(() => ({ twoFactorEnabled: true, securityKeysList: [], usePasswordLessLogin: false }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => account }));
vi.mock('@features/auth/frontend/accounts.js', () => ({ updateCurrentAccountPartial: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: () => true, startRegistration: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ authenticateDialog: vi.fn(), apiWithDialog: vi.fn(), inputText: vi.fn(), promiseDialog: vi.fn() }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({ render: () => null }) }));
vi.mock('@features/ui/frontend/components/MkFolder.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', [slots.label?.(), slots.default?.()]) }) }));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) }) }));
vi.mock('@features/navigation/frontend/components/MkLink.vue', () => ({ default: defineComponent({ render: () => null }) }));

const options = {
	challenge: 'synthetic-challenge', rp: { name: 'Synthetic Misskey', id: 'synthetic.example' },
	user: { id: 'synthetic-user', name: 'synthetic-user', displayName: 'Synthetic user' },
	pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }],
};
const credential: RegistrationResponseJSON = {
	id: 'synthetic-credential', rawId: 'synthetic-credential', type: 'public-key',
	response: { clientDataJSON: 'synthetic-client-data', attestationObject: 'synthetic-attestation' },
	clientExtensionResults: {},
};
const internationalization = createInternationalization({ initialLocale: 'en-US' });
let app: ReturnType<typeof createApp>;
let element: HTMLDivElement;
const errors: unknown[] = [];
let expectedError: unknown;

beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
});
beforeEach(() => {
	vi.resetAllMocks();
	errors.length = 0;
	expectedError = undefined;
	vi.mocked(os.authenticateDialog)
		.mockResolvedValueOnce({ canceled: false, result: { password: 'synthetic-current', token: '111111' } })
		.mockResolvedValue({ canceled: false, result: { password: 'synthetic-current', token: '222222' } });
	vi.mocked(os.apiWithDialog).mockResolvedValueOnce(options as never).mockResolvedValue({ id: credential.id, name: 'Synthetic key' } as never);
	vi.mocked(os.inputText).mockResolvedValue({ canceled: false, result: 'Synthetic key' });
	vi.mocked(startRegistration).mockResolvedValue(credential);
	vi.mocked(os.promiseDialog).mockImplementation(promise => promise);
	element = window.document.createElement('div');
	app = createApp(Settings);
	app.config.errorHandler = error => { errors.push(error); };
	app.use(internationalization);
	const slot = defineComponent({ inheritAttrs: false, setup: (_, { slots }) => () => h('div', slots.default?.()) });
	for (const name of ['SearchMarker', 'SearchLabel', 'SearchText', 'I18n', 'MkTime']) app.component(name, slot);
	app.mount(element);
});
afterEach(() => {
	expect(errors).toEqual(expectedError === undefined ? [] : [expectedError]);
	vi.useRealTimers();
	app.unmount();
	element.remove();
});

function start() {
	const button = [...element.querySelectorAll('button')].find(button => button.textContent === 'Register a security or pass key');
	expect(button).toBeDefined();
	button!.click();
}

async function settle() {
	for (let i = 0; i < 15; i++) await Promise.resolve();
}

function expectCompletion(token = '222222') {
	expect(os.apiWithDialog).toHaveBeenNthCalledWith(2, 'i/2fa/passkey/done', {
		password: 'synthetic-current', token, name: 'Synthetic key', credential,
	});
}

describe('passkey registration', () => {
	test('collects the password first and reuses it in the final MFA-only dialog', async () => {
		start();
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(2));
		expect(os.authenticateDialog).toHaveBeenNthCalledWith(1);
		expect(os.authenticateDialog).toHaveBeenNthCalledWith(2, { currentPassword: 'synthetic-current' });
		expect(os.apiWithDialog).toHaveBeenNthCalledWith(1, 'i/2fa/passkey/register', { password: 'synthetic-current', token: '111111' });
		expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: options });
		expectCompletion();
	});
	test('requests a fresh final token only after a two-minute browser operation', async () => {
		vi.useFakeTimers();
		const startedAt = Date.now();
		let finish!: (value: RegistrationResponseJSON) => void;
		vi.mocked(startRegistration).mockReturnValue(new Promise(resolve => { finish = resolve; }));
		let finalRequestedAt: number | null = null;
		vi.mocked(os.authenticateDialog).mockReset()
			.mockResolvedValueOnce({ canceled: false, result: { password: 'synthetic-current', token: '111111' } })
			.mockImplementation(async () => {
				finalRequestedAt = Date.now();
				return { canceled: false, result: { password: 'synthetic-current', token: '222222' } };
			});
		start();
		await vi.advanceTimersByTimeAsync(0);
		expect(startRegistration).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(120000);
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
		expect(os.apiWithDialog).toHaveBeenCalledOnce();
		finish(credential);
		await vi.advanceTimersByTimeAsync(0);
		expect(finalRequestedAt).toBe(startedAt + 120000);
		expect(os.authenticateDialog).toHaveBeenNthCalledWith(2, { currentPassword: 'synthetic-current' });
		expectCompletion();
	});
	test('uses a different backup code for completion instead of replaying the first', async () => {
		vi.mocked(os.authenticateDialog).mockReset()
			.mockResolvedValueOnce({ canceled: false, result: { password: 'synthetic-current', token: 'A'.repeat(32) } })
			.mockResolvedValueOnce({ canceled: false, result: { password: 'synthetic-current', token: 'B'.repeat(32) } });
		start();
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(2));
		expectCompletion('B'.repeat(32));
	});
	test('initial cancellation does not issue a challenge or access the authenticator', async () => {
		vi.mocked(os.authenticateDialog).mockReset().mockResolvedValue({ canceled: true, result: undefined });
		start();
		await settle();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
		expect(os.inputText).not.toHaveBeenCalled();
		expect(startRegistration).not.toHaveBeenCalled();
	});
	test('name cancellation does not access the authenticator or complete registration', async () => {
		vi.mocked(os.inputText).mockResolvedValue({ canceled: true, result: undefined });
		start();
		await settle();
		expect(os.apiWithDialog).toHaveBeenCalledOnce();
		expect(startRegistration).not.toHaveBeenCalled();
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
	});
	test('browser cancellation does not request final MFA or complete registration', async () => {
		expectedError = new DOMException('Synthetic cancellation', 'NotAllowedError');
		vi.mocked(startRegistration).mockRejectedValue(expectedError);
		start();
		await settle();
		expect(os.apiWithDialog).toHaveBeenCalledOnce();
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
	});
	test('final MFA cancellation does not complete registration', async () => {
		vi.mocked(os.authenticateDialog).mockReset()
			.mockResolvedValueOnce({ canceled: false, result: { password: 'synthetic-current', token: '111111' } })
			.mockResolvedValueOnce({ canceled: true, result: undefined });
		start();
		await settle();
		expect(os.authenticateDialog).toHaveBeenCalledTimes(2);
		expect(os.apiWithDialog).toHaveBeenCalledOnce();
	});
});
