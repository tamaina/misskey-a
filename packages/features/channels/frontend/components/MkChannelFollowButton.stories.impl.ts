/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useLocale } from 'virtual:vite-vue-internationalization';
import { HttpResponse, http } from 'msw';
import { action } from 'storybook/actions';
import { expect, userEvent, within } from '@storybook/test';
import MkChannelFollowButton from '@features/channels/frontend/components/MkChannelFollowButton.vue';
import FeatureLocaleMessages from '@features/channels/frontend/ts-messages.vue';
import { channel } from '../../../../frontend/.storybook/fakes.js';
import { commonHandlers } from '../../../../frontend/.storybook/mocks.js';
import type { StoryObj } from '@storybook/vue3';
import type { Locale } from 'i18n';

function getGlobalLocale() {
	return useLocale<Locale>(import.meta.url).value.env;
}

function sleep(ms: number) {
	return new Promise(resolve => window.setTimeout(resolve, ms));
}

export const Default = {
	render(args) {
		return {
			components: {
				MkChannelFollowButton,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkChannelFollowButton v-bind="props" />',
		};
	},
	args: {
		channel: channel(),
		full: true,
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const buttonElement = canvas.getByRole<HTMLButtonElement>('button');
		await expect(buttonElement).toHaveTextContent(getGlobalLocale().follow);
		await userEvent.click(buttonElement);
		await sleep(1000);
		await expect(buttonElement).toHaveTextContent(FeatureLocaleMessages.$locale.unfollow);
		await userEvent.click(buttonElement);
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/channels/follow', async ({ request }) => {
					action('POST /api/channels/follow')(await request.json());
					return HttpResponse.json({});
				}),
				http.post('/api/channels/unfollow', async ({ request }) => {
					action('POST /api/channels/unfollow')(await request.json());
					return HttpResponse.json({});
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkChannelFollowButton>;
