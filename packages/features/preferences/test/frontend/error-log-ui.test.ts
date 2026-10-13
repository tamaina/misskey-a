/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import ErrorLog from '@features/preferences/frontend/pages/settings/error-log.vue';
import { clearClientErrorLogs, clientErrorLogs, recordClientError } from '@features/runtime/frontend/error-log.js';
import * as os from '@features/ui/frontend/os.js';

vi.mock('@features/ui/frontend/os.js', () => ({
	confirm: vi.fn(async () => ({ canceled: false })),
	alert: vi.fn(),
	toast: vi.fn(),
}));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: {
	props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>',
} }));

const internationalization = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
});

beforeEach(() => {
	cleanup();
	vi.clearAllMocks();
	clearClientErrorLogs();
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => {}) } });
});

function open() {
	return render(ErrorLog, { global: { plugins: [internationalization], stubs: { MkTime: true, MkFolder: defineComponent({
		setup: () => ({ opened: ref(false) }),
		template: '<div><button data-testid="folder-toggle" @click="opened = !opened">Details</button><div v-if="opened" data-testid="folder-body"><slot /></div></div>',
	}) } } });
}

it('disables actions for empty logs and renders, copies and deletes saved logs', async () => {
	const empty = open();
	expect((screen.getByText('Copy all') as HTMLButtonElement).disabled).toBe(true);
	empty.unmount();
	recordClientError('error', 'test error');
	open();
	expect(screen.getByText(/test error/)).toBeTruthy();
	await fireEvent.click(screen.getByText('Copy'));
	await waitFor(() => expect(os.toast).toHaveBeenCalledWith('Copied to clipboard'));
	expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('test error'));
	await fireEvent.click(screen.getByText('Delete all'));
	await waitFor(() => expect(clientErrorLogs.value).toEqual([]));
});

it('reports failed copies and keeps logs when deletion is canceled', async () => {
	recordClientError('error', 'test error');
	vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('denied'));
	vi.mocked(os.confirm).mockResolvedValueOnce({ canceled: true } as never);
	open();
	await fireEvent.click(screen.getByText('Copy all'));
	await waitFor(() => expect(os.alert).toHaveBeenCalled());
	expect(os.toast).not.toHaveBeenCalled();
	await fireEvent.click(screen.getByText('Delete all'));
	expect(clientErrorLogs.value).toHaveLength(1);
});

it('keeps expanded details when another log with the same timestamp is prepended', async () => {
	vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-10-13T00:00:00.000Z');
	recordClientError('error', new Error('old error'));
	const oldId = clientErrorLogs.value[0].id;
	const { container } = open();
	const article = container.querySelector('article')!;
	await fireEvent.click(article.querySelector('[data-testid="folder-toggle"]')!);
	expect(article.querySelector('[data-testid="folder-body"]')).not.toBeNull();
	recordClientError('error', 'new error');
	await waitFor(() => expect(container.querySelectorAll('article')).toHaveLength(2));
	expect(container.querySelectorAll('article')[1]).toBe(article);
	expect(article.querySelector('[data-testid="folder-body"]')).not.toBeNull();
	expect(clientErrorLogs.value[0].id).toBe(oldId);
	vi.restoreAllMocks();
});

it('reports deletion failure without removing the displayed log', async () => {
	recordClientError('error', 'test error');
	const { miLocalStorage } = await import('@features/preferences/frontend/local-storage.js');
	const removeItem = vi.spyOn(miLocalStorage, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
	open(); await fireEvent.click(screen.getByText('Delete all'));
	await waitFor(() => expect(os.alert).toHaveBeenCalled());
	expect(clientErrorLogs.value).toHaveLength(1);
	removeItem.mockRestore();
});
