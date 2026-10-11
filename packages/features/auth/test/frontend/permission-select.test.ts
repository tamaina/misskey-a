/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, reactive } from 'vue';
import MkPermissionSelect from '../../frontend/components/MkPermissionSelect.vue';

vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({
	props: ['modelValue'], emits: ['update:modelValue'],
	setup: (props, { emit, slots }) => () => h('label', [h('input', { type: 'checkbox', checked: props.modelValue, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) }), slots.default?.()]),
}) }));

it('starts all OFF, records explicit toggles, and removes ineligible selections on account/resource changes', async () => {
	const props = reactive({
		modelValue: [] as string[], permissions: ['read:account', 'access:mcp', 'write:admin:meta'], administrator: false,
		labels: { 'read:account': 'Read account', 'access:mcp': 'MCP', 'write:admin:meta': 'Admin' },
		disableAllText: 'Disable all', enableAllText: 'Enable all', adminPermissionText: 'Admin permissions',
	});
	const element = window.document.createElement('div'); window.document.body.appendChild(element);
	const app = createApp({ render: () => h(MkPermissionSelect, { ...props, 'onUpdate:modelValue': (value: string[]) => { props.modelValue = value; } }) });
	app.mount(element); await nextTick();
	const inputs = () => [...element.querySelectorAll('input')];
	const set = async (index: number) => { inputs()[index].checked = true; inputs()[index].dispatchEvent(new Event('change')); await nextTick(); };
	try {
		expect(inputs()).toHaveLength(2); expect(inputs().every(input => !input.checked)).toBe(true);
		await set(0); expect(props.modelValue).toEqual(['read:account']);
		props.administrator = true; await nextTick(); expect(inputs()).toHaveLength(3);
		await set(2); expect(props.modelValue).toEqual(['read:account', 'write:admin:meta']);
		props.administrator = false; await nextTick(); expect(props.modelValue).toEqual(['read:account']);
		element.querySelectorAll('button')[1].click(); await nextTick(); expect(props.modelValue).toEqual(['read:account', 'access:mcp']);
		props.permissions = ['read:account']; await nextTick(); expect(props.modelValue).toEqual(['read:account']);
		element.querySelectorAll('button')[0].click(); await nextTick(); expect(props.modelValue).toEqual([]);
	} finally { app.unmount(); element.remove(); }
});
