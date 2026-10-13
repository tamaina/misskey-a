/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeEach, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import fetch from 'node-fetch';
import { callbackUrl, isPublicAddress, sendPublicWebhook } from '@features/runtime/backend/http/mcp-webhook.js';
vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));
vi.mock('node-fetch', () => ({ default: vi.fn() }));
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(lookup).mockResolvedValue([{ address: '8.8.8.8', family: 4 }] as never);
	vi.mocked(fetch).mockResolvedValue({ status: 200, ok: true, text: async () => '{}' } as never);
});
it.each(['http://example.com', 'https://user:password@example.com', 'https://example.com/#fragment', 'https://example.com:444'])('rejects unsafe callback %s before networking', value => {
	expect(() => callbackUrl(value)).toThrow();
});
it.each(['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.0.1', '169.254.169.254', '0.0.0.0', '224.0.0.1', '::1', '::', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1', '2001:db8::1'])('blocks non-public address %s', address => {
	expect(isPublicAddress(address)).toBe(false);
});
it('blocks mixed DNS answers and checks every connection against rebinding', async () => {
	vi.mocked(lookup).mockResolvedValue([{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }] as never);
	await expect(sendPublicWebhook('https://callback.example/path', '{}', {})).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled();
	vi.mocked(lookup).mockResolvedValue([{ address: '8.8.8.8', family: 4 }] as never);
	await sendPublicWebhook('https://callback.example/path', '{}', {});
	vi.mocked(lookup).mockResolvedValue([{ address: '169.254.169.254', family: 4 }] as never);
	await expect(sendPublicWebhook('https://callback.example/path', '{}', {})).rejects.toThrow(); expect(fetch).toHaveBeenCalledTimes(1);
});
it('pins validated address while retaining TLS hostname, blocks redirects and rechecks authorization', async () => {
	const beforeSend = vi.fn();
	vi.mocked(fetch).mockImplementation(async (url, options) => {
		expect(String(url)).toBe('https://callback.example/path'); expect(options?.redirect).toBe('manual');
		const agent = options?.agent as unknown as { options: { lookup: (host: string, opts: object, callback: (...values: unknown[]) => void) => void } };
		const callback = vi.fn(); agent.options.lookup('callback.example', { all: true }, callback);
		expect(callback).toHaveBeenCalledWith(null, [{ address: '8.8.8.8', family: 4 }]); expect(beforeSend).toHaveBeenCalled();
		return { status: 302, ok: false, text: async () => '{}' } as never;
	});
	expect(await sendPublicWebhook('https://callback.example/path', '{}', {}, { beforeSend })).toMatchObject({ status: 302, ok: false }); expect(fetch).toHaveBeenCalledTimes(1);
	beforeSend.mockRejectedValue(new Error('Revoked')); await expect(sendPublicWebhook('https://callback.example/path', '{}', {}, { beforeSend })).rejects.toThrow('Revoked'); expect(fetch).toHaveBeenCalledTimes(1);
});

it('preserves terminal status even when the response body exceeds the limit', async () => {
	vi.mocked(fetch).mockResolvedValue({ status: 410, ok: false, text: async () => { throw new Error('Response size exceeded'); } } as never);
	expect(await sendPublicWebhook('https://callback.example/path', '{}', {})).toEqual({ status: 410, ok: false, text: '' });
});
