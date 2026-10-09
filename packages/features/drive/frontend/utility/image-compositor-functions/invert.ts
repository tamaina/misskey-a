/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './invert.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction<{
	r: boolean;
	g: boolean;
	b: boolean;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1i(u.r, params.r ? 1 : 0);
		gl.uniform1i(u.g, params.g ? 1 : 0);
		gl.uniform1i(u.b, params.b ? 1 : 0);
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.invert,
	params: {
		r: {
			label: messages._imageEffector._fxProps.redComponent,
			type: 'boolean',
			default: true,
		},
		g: {
			label: messages._imageEffector._fxProps.greenComponent,
			type: 'boolean',
			default: true,
		},
		b: {
			label: messages._imageEffector._fxProps.blueComponent,
			type: 'boolean',
			default: true,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
