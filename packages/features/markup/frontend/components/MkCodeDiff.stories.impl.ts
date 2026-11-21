/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import MkCodeDiff from '@features/markup/frontend/components/MkCodeDiff.vue';
const code = `for (let i, 100) {
	<: if (i % 15 == 0) "FizzBuzz"
		elif (i % 3 == 0) "Fizz"
		elif (i % 5 == 0) "Buzz"
		else i
}`;
export const Default = {
	render(args) {
		return {
			components: {
				MkCodeDiff,
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
			template: '<MkCodeDiff v-bind="props" />',
		};
	},
	args: {
		code,
		lang: 'is',
		diffBase: code.replace('FizzBuzz', 'Fizz'),
		maxHeight: 300,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCodeDiff>;
