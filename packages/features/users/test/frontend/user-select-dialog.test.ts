/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fireEvent, render } from '@testing-library/vue';
import { nextTick } from 'vue';
import { expect, test, vi } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Dialog from '../../frontend/components/MkUserSelectDialog.vue';

const api = vi.hoisted(() => vi.fn());
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: api }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ hostname: 'local.test', host: 'local.test:3000' }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { id: 'self', username: 'Alice' } }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: { s: { recentlyUsedUsers: [] } } }));
vi.mock('@features/instance/frontend/instance.js', () => ({ instance: { federation: 'all' } }));
vi.mock('@features/ui/frontend/components/MkInput.vue', () => ({
	default: { props: ['modelValue'], template: `<input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">` },
}));
vi.mock('@features/ui/frontend/components/form/split.vue', () => ({ default: { template: '<div><slot/></div>' } }));
vi.mock('@features/ui/frontend/components/MkModalWindow.vue', () => ({
	default: { emits: ['click', 'ok', 'close', 'closed'], props: ['okButtonDisabled'], template: '<div><slot/><button :disabled="okButtonDisabled">OK</button></div>' },
}));

async function open(localOnly: boolean) {
	api.mockReset().mockResolvedValue([]);
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
	await intl.ready;
	return render(Dialog, {
		props: { localOnly },
		global: { plugins: [intl], stubs: { MkAvatar: true, MkAcct: true, MkUserName: { props: ['user'], template: '<span>{{ user.username }}</span>' } } },
	});
}

test('only an explicit local host opts in and cannot promote an excluded self', async () => {
	const view = await open(false);
	try {
		const [name, host] = view.getAllByRole('textbox');
		await fireEvent.update(name, 'bob');
		for (const value of ['', 'remote.test', 'LOCAL.TEST', 'local.test:3000']) {
			if (value) await fireEvent.update(host, value);
			const [endpoint, params] = api.mock.lastCall!;
			expect(endpoint).toBe('users/search-by-username-and-host');
			if (value.toLowerCase().startsWith('local.test')) {
				expect(params).toMatchObject({ host: '.', preferLocalExactMatch: true, limit: 10 });
			} else {
				expect(params.host).toBe(value);
				expect(params).not.toHaveProperty('preferLocalExactMatch');
			}
		}
		api.mockResolvedValueOnce([{ id: 'self', username: 'Alice' }]);
		await fireEvent.update(name, 'ALICE');
		await nextTick();
		expect(api.mock.lastCall![1]).not.toHaveProperty('preferLocalExactMatch');
		expect(view.queryByText('Alice')).toBeNull();
	} finally { view.unmount(); }
});

test('local-only searches ignore stale results and clear a previous selection', async () => {
	const view = await open(true);
	try {
		const name = view.getByRole('textbox');
		const pending = Promise.withResolvers<{ id: string; username: string }[]>();
		api.mockReturnValueOnce(pending.promise).mockResolvedValueOnce([{ id: 'b', username: 'Bob' }]);
		await fireEvent.update(name, 'bo');
		await fireEvent.update(name, 'bob');
		expect(api.mock.lastCall![1]).toMatchObject({ host: '.', preferLocalExactMatch: true });
		await fireEvent.click(await view.findByText('Bob'));
		const ok = view.getByRole('button') as HTMLButtonElement;
		expect(ok.disabled).toBe(false);
		pending.resolve([{ id: 'a', username: 'Bobby' }]);
		await nextTick();
		expect(view.queryByText('Bobby')).toBeNull();
		expect(view.getByText('Bob')).toBeTruthy();
		const cleared = Promise.withResolvers<{ id: string; username: string }[]>();
		api.mockReturnValueOnce(cleared.promise);
		await fireEvent.update(name, 'bobby');
		expect(ok.disabled).toBe(true);
		await fireEvent.update(name, '');
		cleared.resolve([{ id: 'a', username: 'Bobby' }]);
		await nextTick();
		expect(view.queryByText('Bobby')).toBeNull();
		expect(ok.disabled).toBe(true);
	} finally { view.unmount(); }
});
