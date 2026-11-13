/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import PasswordDialog from '../../frontend/components/MkPasswordDialog.vue';

const account = vi.hoisted(() => ({ twoFactorEnabled: true }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => account }));
vi.mock('@features/discovery/frontend/utility/autocomplete.js', () => ({ Autocomplete: class {} }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }),
}));
vi.mock('@features/ui/frontend/components/MkModalWindow.vue', () => ({
	default: defineComponent({
		emits: ['close', 'closed', 'esc'],
		setup: (_, { emit, expose, slots }) => {
			expose({ close: () => emit('closed') });
			return () => h('div', { onKeydown: (event: KeyboardEvent) => { if (event.key === 'Escape') emit('esc'); } }, [
				h('button', { 'data-testid': 'close', onClick: () => emit('close') }, 'Close'),
				slots.default?.(),
			]);
		},
	}),
}));

const internationalization = createInternationalization({ initialLocale: 'en-US' });
let app: ReturnType<typeof createApp>;
let element: HTMLDivElement;

beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
	vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
	app.unmount();
	element.remove();
	account.twoFactorEnabled = true;
});

async function mount(currentPassword?: string) {
	const done = vi.fn();
	const cancelled = vi.fn();
	element = window.document.createElement('div');
	window.document.body.appendChild(element);
	app = createApp(PasswordDialog, { currentPassword, onDone: done, onCancelled: cancelled });
	app.use(internationalization);
	app.directive('adaptive-border', {});
	app.mount(element);
	await nextTick();
	return { done, cancelled };
}

async function fill(input: HTMLInputElement, value: string) {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await nextTick();
}

describe('password/MFA dialog', () => {
	test('retains password and token inputs for existing callers', async () => {
		await mount();
		const password = element.querySelector<HTMLInputElement>('input[type=password]')!;
		expect(password.autocomplete).toBe('current-password webauthn');
		expect(window.document.activeElement).toBe(password);
		expect(element.querySelector('input[autocomplete="one-time-code"]')).not.toBeNull();
	});

	test('focuses only the fresh token and preserves the previously collected password', async () => {
		const { done } = await mount('synthetic-current');
		expect(element.querySelector('input[type=password]')).toBeNull();
		expect(element.innerHTML).not.toContain('synthetic-current');
		const token = element.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]')!;
		expect(window.document.activeElement).toBe(token);
		expect(token.required).toBe(true);
		const submit = element.querySelector<HTMLButtonElement>('button[type=submit]')!;
		expect(submit.disabled).toBe(true);
		await fill(token, '654321');
		expect(submit.disabled).toBe(false);
		element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
		expect(done).toHaveBeenCalledWith({ password: 'synthetic-current', token: '654321' });
	});

	test('retains backup-code entry in the final MFA dialog', async () => {
		const { done } = await mount('synthetic-current');
		element.querySelector<HTMLButtonElement>('button[type=button]')!.click();
		await nextTick();
		const token = element.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]')!;
		expect(token.pattern).toBe('^[A-Z0-9]{32}$');
		await fill(token, 'A'.repeat(32));
		element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
		expect(done).toHaveBeenCalledWith({ password: 'synthetic-current', token: 'A'.repeat(32) });
	});

	test.each(['close', 'Escape'])('cancels through %s without emitting credentials', async action => {
		const { done, cancelled } = await mount('synthetic-current');
		if (action === 'close') element.querySelector<HTMLButtonElement>('[data-testid=close]')!.click();
		else element.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(cancelled).toHaveBeenCalledOnce();
		expect(done).not.toHaveBeenCalled();
	});
});
