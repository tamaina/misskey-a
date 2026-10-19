/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import * as account from '../i.js';
import MkBrowserSessions from './MkBrowserSessions.vue';

const sessions = [
	{ id: 'synthetic-current', current: true, createdAt: '2026-10-01T09:00:00.000Z', lastUsedAt: '2026-10-19T09:00:00.000Z', revokedAt: null },
	{ id: 'synthetic-other', current: false, createdAt: '2026-10-02T09:00:00.000Z', lastUsedAt: '2026-10-18T09:00:00.000Z', revokedAt: null },
];
const block = http.all('*/api/*', () => HttpResponse.json({ error: { code: 'STORYBOOK_ONLY', message: 'No real session changes in Storybook' } }, { status: 403 }));
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
	parameters: { layout: 'centered', msw: { handlers: [http.post('*/api/i/sessions', () => HttpResponse.json(sessions)), block] } },
} satisfies StoryObj<typeof MkBrowserSessions>;
export const LoadFailure = {
	...CurrentAndOther,
	parameters: { layout: 'centered', msw: { handlers: [block] } },
} satisfies StoryObj<typeof MkBrowserSessions>;
