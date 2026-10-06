/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@storybook/vue3';
import MkError from '@features/ui/frontend/components/global/MkError.vue';

export const argTypes = {
	onRetry: {
		action: 'retry',
	},
} satisfies Meta<typeof MkError>['argTypes'];
