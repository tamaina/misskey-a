/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './mirror.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction<{
	h: number;
	v: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1i(u.h, params.h);
		gl.uniform1i(u.v, params.v);
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.mirror,
	params: {
		h: {
			label: messages.horizontal,
			type: 'number:enum',
			enum: [
				{ value: -1 as const, icon: 'ti ti-arrow-bar-right' },
				{ value: 0 as const, icon: 'ti ti-minus-vertical' },
				{ value: 1 as const, icon: 'ti ti-arrow-bar-left' },
			],
			default: -1,
		},
		v: {
			label: messages.vertical,
			type: 'number:enum',
			enum: [
				{ value: -1 as const, icon: 'ti ti-arrow-bar-down' },
				{ value: 0 as const, icon: 'ti ti-minus' },
				{ value: 1 as const, icon: 'ti ti-arrow-bar-up' },
			],
			default: 0,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
