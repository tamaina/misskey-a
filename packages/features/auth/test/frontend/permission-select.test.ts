/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, reactive } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { locales } from 'i18n';
import MkPermissionSelect from '../../frontend/components/MkPermissionSelect.vue';

vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({
	props: ['modelValue'], emits: ['update:modelValue'],
	setup: (props, { emit, slots }) => () => h('label', [h('input', { type: 'checkbox', checked: props.modelValue, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) }), slots.default?.()]),
}) }));

it('starts all OFF, records explicit toggles, and removes ineligible selections on account/resource changes', async () => {
	const props = reactive({
		modelValue: [] as string[], permissions: ['read:account', 'access:mcp', 'write:admin:meta'], administrator: false,
	});
	const element = window.document.createElement('div'); window.document.body.appendChild(element);
	const app = createApp({ render: () => h(MkPermissionSelect, { ...props, 'onUpdate:modelValue': (value: string[]) => { props.modelValue = value; } }) });
	const internationalization = createInternationalization({ initialLocale: 'en-US' });
	await internationalization.ready;
	app.use(internationalization);
	app.mount(element); await nextTick();
	const inputs = () => [...element.querySelectorAll('input')];
	const click = async (label: string) => {
		const button = [...element.querySelectorAll('button')].find(button => button.textContent === label);
		expect(button).toBeDefined(); button!.click(); await nextTick();
	};
	const set = async (index: number) => { inputs()[index].checked = true; inputs()[index].dispatchEvent(new Event('change')); await nextTick(); };
	try {
		expect(element.querySelectorAll('button')).toHaveLength(2);
		expect(element.textContent).not.toContain('Enable all admin permissions');
		expect(element.textContent).not.toContain('Disable all admin permissions');
		expect(element.textContent).toContain(locales['en-US']._permissions['read:account']);
		expect(element.textContent).toContain(locales['en-US']._permissions['access:mcp']);
		expect(inputs()).toHaveLength(2); expect(inputs().every(input => !input.checked)).toBe(true);
		await set(0); expect(props.modelValue).toEqual(['read:account']);
		props.administrator = true; await nextTick(); expect(inputs()).toHaveLength(3);
		await set(2); expect(props.modelValue).toEqual(['read:account', 'write:admin:meta']);
		props.administrator = false; await nextTick(); expect(props.modelValue).toEqual(['read:account']);
		await click('Enable all'); expect(props.modelValue).toEqual(['read:account', 'access:mcp']);
		props.permissions = ['read:account']; await nextTick(); expect(props.modelValue).toEqual(['read:account']);
		await click('Disable all'); expect(props.modelValue).toEqual([]);
	} finally { app.unmount(); element.remove(); }
});

it('changes ordinary and read/write admin groups independently, preserving the other group', async () => {
	const ordinary = ['read:account', 'access:mcp'];
	const admin = ['read:admin:meta', 'write:admin:meta'];
	const props = reactive({
		modelValue: ['read:account', 'read:admin:meta'], permissions: [...ordinary, ...admin], administrator: true,
	});
	const element = window.document.createElement('div'); window.document.body.appendChild(element);
	const app = createApp({ render: () => h(MkPermissionSelect, { ...props, 'onUpdate:modelValue': (value: string[]) => { props.modelValue = value; } }) });
	const internationalization = createInternationalization({ initialLocale: 'en-US' });
	await internationalization.ready;
	app.use(internationalization);
	app.mount(element); await nextTick();
	const click = async (label: string) => {
		const button = [...element.querySelectorAll('button')].find(button => button.textContent === label);
		expect(button).toBeDefined(); button!.click(); await nextTick();
	};
	try {
		expect(element.querySelectorAll('button')).toHaveLength(4);
		await click('Disable all'); expect(props.modelValue).toEqual(['read:admin:meta']);
		await click('Enable all'); expect(props.modelValue).toEqual(['read:admin:meta', ...ordinary]);
		await click('Disable all admin permissions'); expect(props.modelValue).toEqual(ordinary);
		await click('Disable all'); expect(props.modelValue).toEqual([]);
		await click('Enable all'); expect(props.modelValue).toEqual(ordinary);
		await click('Enable all admin permissions'); expect(props.modelValue).toEqual([...ordinary, ...admin]);
		await click('Enable all admin permissions'); expect(props.modelValue).toEqual([...ordinary, ...admin]);
		await click('Disable all admin permissions'); expect(props.modelValue).toEqual(ordinary);
		await click('Disable all');
		await click('Enable all admin permissions'); expect(props.modelValue).toEqual(admin);
		props.administrator = false; await nextTick();
		expect(props.modelValue).toEqual([]); expect(element.querySelectorAll('button')).toHaveLength(2);
	} finally { app.unmount(); element.remove(); }
});
