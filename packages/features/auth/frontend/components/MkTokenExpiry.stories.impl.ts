/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ref } from 'vue';
import type { StoryObj } from '@storybook/vue3';
import MkTokenExpiry from './MkTokenExpiry.vue';

export const NoExpiry = {
	render(args) {
		return {
			components: { MkTokenExpiry },
			setup() { return { args, value: ref(args.modelValue) }; },
			template: '<div style="width: min(560px, 100vw); padding: 24px; box-sizing: border-box"><MkTokenExpiry v-model="value" :disabled="args.disabled" /></div>',
		};
	},
	args: { modelValue: null, disabled: false },
	parameters: { layout: 'centered' },
} satisfies StoryObj<typeof MkTokenExpiry>;
export const FixedExpiry = { ...NoExpiry, args: { modelValue: '2030-01-02T15:00', disabled: false } } satisfies StoryObj<typeof MkTokenExpiry>;
