/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import MkAuthConfirm from '../../frontend/components/MkAuthConfirm.vue';

vi.mock('@features/auth/frontend/i.js', () => ({ $i: { id: 'synthetic-user', token: `bs_${'a'.repeat(43)}`, isAdmin: false } }));
vi.mock('../../frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn(async () => true) }));
vi.mock('@features/auth/frontend/accounts.js', () => ({ getAccounts: async () => [] }));
vi.mock('@features/ui/frontend/os.js', () => ({}));
vi.mock('@features/drive/frontend/utility/media-proxy.js', () => ({ getProxiedImageUrl: () => '' }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: async () => ({ id: 'synthetic-user', isAdmin: false }) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({
	props: ['modelValue'], emits: ['update:modelValue'],
	setup: (props, { emit, slots }) => () => h('label', [h('input', { type: 'checkbox', checked: props.modelValue, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) }), slots.default?.()]),
}) }));

it.each([
	{ requested: ['access:mcp'] as const, add: false },
	{ requested: ['access:mcp'] as const, add: true },
	{ requested: [] as const, add: false },
	{ requested: [] as const, add: true },
])('starts OFF and requires selection only for empty requested scopes: $requested / $add', async ({ requested, add }) => {
	const accepted = vi.fn();
	const internationalization = createInternationalization({ initialLocale: 'en-US' });
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
	const element = window.document.createElement('div'); window.document.body.appendChild(element);
	const app = createApp({ render: () => h(MkAuthConfirm, { name: 'Synthetic client', permissions: [...requested], selectablePermissions: ['read:account'], selectablePermissionsLabel: 'Additional API permissions (optional)', onAccept: accepted }) });
	app.use(internationalization);
	for (const name of ['MkAvatar', 'MkUserName', 'MkAcct', 'MkLoading']) app.component(name, { render: () => h('span') });
	app.mount(element);
	const flush = async () => { for (let i = 0; i < 8; i++) await nextTick(); };
	try {
		await flush();
		const radio = element.querySelector<HTMLInputElement>('input[type=radio]')!;
		radio.checked = true; radio.dispatchEvent(new Event('change')); await flush();
		const buttons = () => [...element.querySelectorAll<HTMLButtonElement>('button')];
		buttons().find(b => b.textContent?.includes('Continue'))!.click(); await flush();
		await vi.waitFor(() => expect(element.textContent).toContain('Additional API permissions (optional)'));
		if (requested.length > 0) expect(element.querySelector('ul')?.textContent).toContain('MCP');
		else expect(element.querySelector('ul')).toBeNull();
		expect(element.textContent).toContain('Additional API permissions (optional)');
		const checkbox = element.querySelector<HTMLInputElement>('input[type=checkbox]')!;
		expect(checkbox.checked).toBe(false);
		const accept = buttons().find(b => b.textContent === 'Accept')!;
		expect(accept.disabled).toBe(requested.length === 0);
		if (add) { checkbox.checked = true; checkbox.dispatchEvent(new Event('change')); await flush(); }
		accept.click(); await flush();
		if (requested.length === 0 && !add) expect(accepted).not.toHaveBeenCalled();
		else expect(accepted).toHaveBeenCalledWith(`bs_${'a'.repeat(43)}`, add ? ['read:account'] : [], undefined);
	} finally { app.unmount(); element.remove(); }
});
