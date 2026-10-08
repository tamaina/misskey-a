/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './chromaticAberration.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction<{
	normalize: boolean;
	amount: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.amount, params.amount);
		gl.uniform1i(u.normalize, params.normalize ? 1 : 0);
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.chromaticAberration,
	params: {
		normalize: {
			label: messages._imageEffector._fxProps.normalize,
			type: 'boolean',
			default: false,
		},
		amount: {
			label: messages._imageEffector._fxProps.amount,
			type: 'number',
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
