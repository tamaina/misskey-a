/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { startRegistration } from '@simplewebauthn/browser';
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import Settings from '../../frontend/pages/settings/2fa.vue';
import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
import { ownedInputText } from '../../frontend/utility/owned-dialog.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => ({ id: 'synthetic-owner', token: 'bs_synthetic' }) }));
vi.mock('@features/auth/frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn() }));
vi.mock('@features/auth/frontend/utility/owned-dialog.js', () => ({ ownedInputText: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: () => true, startRegistration: vi.fn(), WebAuthnAbortService: { cancelCeremony: vi.fn() } }));
vi.mock('@features/ui/frontend/os.js', () => ({ popup: vi.fn(), inputText: vi.fn(), confirm: vi.fn() }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled }, slots.default?.()) }) }));
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
const state = { totpEnabled: true, passkeyMfaEnabled: false, passkeyCount: 0, passwordlessEnabled: false, passwordLoginDisabled: false, hasVerifiedRecoveryEmail: true, recoveryCodesRemaining: 5 };
const internationalization = createInternationalization({ initialLocale: 'en-US' });
let app: ReturnType<typeof createApp>;
let element: HTMLDivElement;
const errors: unknown[] = [];
const calls = (route: string) => vi.mocked(misskeyApi).mock.calls.filter(([name]) => name === route);

beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
});
beforeEach(async () => {
	vi.resetAllMocks();
	errors.length = 0;
	vi.mocked(ensureSudo).mockResolvedValue(true);
	vi.mocked(ownedInputText).mockResolvedValue({ canceled: false, result: 'Synthetic key' });
	vi.mocked(startRegistration).mockResolvedValue(credential);
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/state') return state as never;
		if (route === 'i/security/keys/list') return [] as never;
		if (route === 'i/security/passkey/register/start') return { ticket: 'synthetic-ticket', options } as never;
		if (route === 'i/security/passkey/register/complete') return { id: credential.id, name: 'Synthetic key', backupCodes: [] } as never;
		throw new Error(`Unexpected API route: ${route}`);
	});
	element = window.document.createElement('div');
	app = createApp(Settings);
	app.config.errorHandler = error => { errors.push(error); };
	app.use(internationalization);
	const slot = defineComponent({ inheritAttrs: false, setup: (_, { slots }) => () => h('div', slots.default?.()) });
	for (const name of ['SearchMarker', 'SearchLabel', 'SearchText', 'I18n', 'MkTime']) app.component(name, slot);
	app.mount(element);
	await vi.waitFor(() => expect(registerButton()).toBeDefined());
});
afterEach(() => {
	expect(errors).toEqual([]);
	vi.useRealTimers();
	app.unmount();
	element.remove();
});

function registerButton() {
	return [...element.querySelectorAll('button')].find(button => button.textContent === 'Register a security or pass key');
}

function start() { registerButton()!.click(); }

async function settled() {
	await nextTick();
	await vi.waitFor(() => expect(registerButton()!.disabled).toBe(false));
}

function expectCompletion(ticket = 'synthetic-ticket') {
	expect(calls('i/security/passkey/register/complete')).toEqual([['i/security/passkey/register/complete', { ticket, credential }]]);
}

describe('passkey registration through session sudo', () => {
	test('reauthenticates before naming and binds completion to the issued ticket', async () => {
		start();
		await vi.waitFor(() => expect(calls('i/security/passkey/register/complete')).toHaveLength(1));
		expect(ensureSudo).toHaveBeenCalledOnce();
		expect(vi.mocked(ensureSudo).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(ownedInputText).mock.invocationCallOrder[0]);
		expect(calls('i/security/passkey/register/start')).toEqual([['i/security/passkey/register/start', { name: 'Synthetic key' }]]);
		expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: options });
		expectCompletion();
	});
	test('a two-minute browser ceremony completes with its ticket without replaying a password or MFA code', async () => {
		vi.useFakeTimers();
		let finish!: (value: RegistrationResponseJSON) => void;
		vi.mocked(startRegistration).mockReturnValue(new Promise(resolve => { finish = resolve; }));
		start();
		await vi.advanceTimersByTimeAsync(0);
		expect(startRegistration).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(120000);
		expect(ensureSudo).toHaveBeenCalledOnce();
		expect(calls('i/security/passkey/register/complete')).toHaveLength(0);
		finish(credential);
		await vi.advanceTimersByTimeAsync(0);
		expectCompletion();
		expect(ensureSudo).toHaveBeenCalledOnce();
	});
	test.each(['sudo', 'name', 'browser'] as const)('%s cancellation does not complete registration and allows retry', async stage => {
		if (stage === 'sudo') vi.mocked(ensureSudo).mockResolvedValueOnce(false);
		if (stage === 'name') vi.mocked(ownedInputText).mockResolvedValueOnce({ canceled: true, result: undefined });
		if (stage === 'browser') vi.mocked(startRegistration).mockRejectedValueOnce(new DOMException('Synthetic cancellation', 'NotAllowedError'));
		start();
		await settled();
		expect(calls('i/security/passkey/register/complete')).toHaveLength(0);
		if (stage === 'sudo') expect(ownedInputText).not.toHaveBeenCalled();
		if (stage !== 'browser') {
			expect(calls('i/security/passkey/register/start')).toHaveLength(0);
			expect(startRegistration).not.toHaveBeenCalled();
		}
		start();
		await vi.waitFor(() => expect(calls('i/security/passkey/register/complete')).toHaveLength(1));
		expectCompletion();
	});
	test('a rejected or expired ticket is not silently retried', async () => {
		vi.mocked(misskeyApi).mockImplementation(async route => {
			if (route === 'i/security/passkey/register/start') return { ticket: 'expired-ticket', options } as never;
			throw new Error('Synthetic expired ticket');
		});
		start();
		await settled();
		expectCompletion('expired-ticket');
		expect(element.querySelector('[role=alert]')).not.toBeNull();
		expect(ensureSudo).toHaveBeenCalledOnce();
	});
});
