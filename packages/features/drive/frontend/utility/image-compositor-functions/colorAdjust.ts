/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './colorAdjust.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction<{
	lightness: number;
	contrast: number;
	hue: number;
	brightness: number;
	saturation: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.brightness, params.brightness);
		gl.uniform1f(u.contrast, params.contrast);
		gl.uniform1f(u.hue, params.hue / 2);
		gl.uniform1f(u.lightness, params.lightness);
		gl.uniform1f(u.saturation, params.saturation);
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.colorAdjust,
	params: {
		lightness: {
			label: messages._imageEffector._fxProps.lightness,
			type: 'number',
			default: 0,
			min: -1,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		contrast: {
			label: messages._imageEffector._fxProps.contrast,
			type: 'number',
			default: 1,
			min: 0,
			max: 4,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		hue: {
			label: messages._imageEffector._fxProps.hue,
			type: 'number',
			default: 0,
			min: -1,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 180) + '°',
		},
		brightness: {
			label: messages._imageEffector._fxProps.brightness,
			type: 'number',
			default: 1,
			min: 0,
			max: 4,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		saturation: {
			label: messages._imageEffector._fxProps.saturation,
			type: 'number',
			default: 1,
			min: 0,
			max: 4,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
