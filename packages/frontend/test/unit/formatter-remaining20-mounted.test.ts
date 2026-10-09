/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp } from 'vue';
import type { Ref } from 'vue';
import { cleanup, fireEvent, render } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { locales } from 'i18n';
import MkPollEditor from '@features/notes/frontend/components/MkPollEditor.vue';
import MkTime from '@features/ui/frontend/components/global/MkTime.vue';
import { lowresTime } from '@features/ui/frontend/shared/use-lowres-time.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue';

vi.mock('chromatic/isChromatic', () => ({ default: () => false }));
vi.mock('@features/ui/frontend/shared/use-lowres-time.js', async () => {
	const { ref } = await import('vue');
	const now = ref(Date.UTC(2026, 0, 1));
	return { lowresTime: now, useLowresTime: () => now };
});
vi.mock('@features/ui/frontend/shared/intl-const.js', () => ({ dateTimeFormat: new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }) }));
vi.mock('@features/ui/frontend/components/MkInput.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue', 'placeholder', 'type'], emits: ['update:modelValue'], setup: (props, { emit, slots }) => () => h('label', [slots.label?.(), h('input', { value: props.modelValue, placeholder: props.placeholder, type: props.type ?? 'text', onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) })]) }) };
});
vi.mock('@features/ui/frontend/components/MkSelect.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue', 'items'], emits: ['update:modelValue'], setup: (props, { emit, slots }) => () => h('label', [slots.label?.(), h('select', { value: props.modelValue, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value) }, (props.items as { label: string; value: string }[]).map(item => h('option', { value: item.value }, item.label)))]) }) };
});
vi.mock('@features/ui/frontend/components/MkSwitch.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit, slots }) => () => h('label', [slots.default?.(), h('input', { type: 'checkbox', checked: props.modelValue, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) })]) }) };
});
vi.mock('@features/ui/frontend/components/MkButton.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['disabled'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled }, slots.default?.()) }) };
});

async function activate(language: string) {
	const runtime = createInternationalization({ initialLocale: language });
	await runtime.ready;
	await runtime.loadLocale(language);
	runtime.install(createApp({}));
	return runtime;
}

afterEach(cleanup);

describe('remaining20 mounted formatter consumers', () => {
	test.each(['en-US', 'ja-JP'])('keeps poll placeholders, repeated edits, deletion, and expiry models in %s', async language => {
		const runtime = await activate(language);
		const dictionary = locales[language];
		const view = render(MkPollEditor, { props: { modelValue: { choices: ['First', 'Second'], multiple: false, expiresAt: null, expiredAfter: null } }, global: { plugins: [runtime] } });
		const placeholder = (n: number) => interpolateLocaleParameters(dictionary._poll.choiceN, { n });
		expect(view.getByPlaceholderText(placeholder(1))).toBeDefined();
		expect(view.getByPlaceholderText(placeholder(2))).toBeDefined();
		await fireEvent.update(view.getByPlaceholderText(placeholder(1)), '$& {x}');
		const last = () => (view.emitted()['update:modelValue'] as [PollEditorModelValue][]).at(-1)![0];
		expect(last().choices).toEqual(['$& {x}', 'Second']);
		await fireEvent.click(view.getByRole('button', { name: dictionary.add }));
		expect(last().choices).toEqual(['$& {x}', 'Second', '']);
		expect(view.getByPlaceholderText(placeholder(3))).toBeDefined();
		await fireEvent.click(view.container.querySelector('li button')!);
		expect(last().choices).toEqual(['Second', '']);
		await fireEvent.click(view.getByRole('checkbox', { name: dictionary._poll.canMultipleVote }));
		expect(last().multiple).toBe(true);
		await fireEvent.update(view.getByRole('combobox', { name: dictionary._poll.expiration }), 'after');
		await fireEvent.update(view.getByRole('spinbutton', { name: dictionary._poll.duration }), '5');
		const unit = view.getAllByRole('combobox').find(select => select !== view.getByRole('combobox', { name: dictionary._poll.expiration }))!;
		await fireEvent.update(unit, 'minute');
		expect(last()).toMatchObject({ expiresAt: null, expiredAfter: 300000, multiple: true });
		await fireEvent.update(view.getByRole('combobox', { name: dictionary._poll.expiration }), 'infinite');
		expect(last()).toMatchObject({ expiresAt: null, expiredAfter: null });
	});

	test.each(['en-US', 'ja-JP'])('keeps clock-driven past/future branches, detail mode, and invalid dates in %s', async language => {
		const runtime = await activate(language);
		const clock = lowresTime as Ref<number>;
		const base = Date.UTC(2026, 0, 1);
		clock.value = base;
		const dictionary = locales[language];
		const past = render(MkTime, { props: { time: base - 30000 }, global: { plugins: [runtime] } });
		expect(past.container.textContent).toContain(interpolateLocaleParameters(dictionary._ago.secondsAgo, { n: '30' }));
		clock.value = base + 90000;
		await vi.waitFor(() => expect(past.container.textContent).toContain(interpolateLocaleParameters(dictionary._ago.minutesAgo, { n: '2' })));
		await past.rerender({ mode: 'detail' });
		expect(past.container.textContent).toContain(past.container.querySelector('time')!.title);
		await past.rerender({ mode: 'absolute' });
		expect(past.container.textContent!.trim()).toBe(past.container.querySelector('time')!.title);
		past.unmount();
		clock.value = base;
		const future = render(MkTime, { props: { time: base + 120000 }, global: { plugins: [runtime] } });
		expect(future.container.textContent).toContain(interpolateLocaleParameters(dictionary._timeIn.minutes, { n: '2' }));
		future.unmount();
		const invalid = render(MkTime, { props: { time: null }, global: { plugins: [runtime] } });
		expect(invalid.container.textContent).toContain(dictionary._ago.invalid);
		expect(invalid.container.querySelector('time')!.title).toBe(dictionary._ago.invalid);
	});
});
