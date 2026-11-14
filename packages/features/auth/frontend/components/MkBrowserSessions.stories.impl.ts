/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import * as account from '../i.js';
import MkBrowserSessions from './MkBrowserSessions.vue';

const sessions: { id: string; current: boolean; createdAt: string; lastUsedAt: string; revokedAt: string | null; lastIp: string; lastUserAgent: string }[] = [
	{ id: 'synthetic-current', current: true, createdAt: '2026-10-01T09:00:00.000Z', lastUsedAt: '2026-10-19T09:00:00.000Z', revokedAt: null, lastIp: '192.0.2.1', lastUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/145.0' },
	{ id: 'synthetic-other', current: false, createdAt: '2026-10-02T09:00:00.000Z', lastUsedAt: '2026-10-18T09:00:00.000Z', revokedAt: null, lastIp: '192.0.2.1', lastUserAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140.0.0.0 Mobile Safari/537.36' },
];
sessions.push({ ...sessions[1], id: 'synthetic-revoked', revokedAt: '2026-10-19T09:00:00.000Z' });
const history = [
	...sessions.map((session, index) => ({ id: `synthetic-signin${5 - index}`, createdAt: session.createdAt, ip: session.lastIp, headers: {}, success: true, browserSessionId: session.id, browserSession: session })),
	{ id: 'synthetic-signin2', createdAt: sessions[0].createdAt, ip: '192.0.2.2', headers: { 'user-agent': sessions[0].lastUserAgent }, success: false, browserSessionId: null, browserSession: null },
	{ id: 'synthetic-signin1', createdAt: sessions[0].createdAt, ip: '192.0.2.3', headers: {}, success: true, browserSessionId: null, browserSession: null },
];
const historyHandler = http.post('*/api/i/signin-history', async ({ request }) => {
	const input = await request.json() as { untilId?: string; sinceId?: string };
	return HttpResponse.json(input.untilId || input.sinceId ? [] : history);
});
const block = http.all(`${window.location.origin}/api/*`, () => HttpResponse.json({ error: { code: 'STORYBOOK_ONLY', message: 'No real session changes in Storybook' } }, { status: 403 }));
export const CurrentAndOther = {
	render() {
		return {
			components: { MkBrowserSessions },
			setup() {
				if (!account.$i) throw new Error('Storybook synthetic account required');
				account.$i.token = 'bs_storybook_synthetic_sessions';
				return {};
			},
			template: '<div style="width: min(640px, 100vw); padding: 24px; box-sizing: border-box"><MkBrowserSessions /></div>',
		};
	},
	parameters: { layout: 'centered', msw: { handlers: [historyHandler, http.post('*/api/i/session-ips', () => HttpResponse.json([{ id: 'synthetic-history', createdAt: sessions[0].createdAt, ip: '192.0.2.1', lastSeenAt: sessions[0].lastUsedAt }])), block] } },
} satisfies StoryObj<typeof MkBrowserSessions>;
export const LoadFailure = {
	...CurrentAndOther,
	parameters: { layout: 'centered', msw: { handlers: [block] } },
} satisfies StoryObj<typeof MkBrowserSessions>;
