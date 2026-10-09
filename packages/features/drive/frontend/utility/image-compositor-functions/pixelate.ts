/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './pixelate.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction<{
	offsetX: number;
	offsetY: number;
	scaleX: number;
	scaleY: number;
	ellipse: boolean;
	angle: number;
	strength: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.offset, params.offsetX / 2, params.offsetY / 2);
		gl.uniform2f(u.scale, params.scaleX / 2, params.scaleY / 2);
		gl.uniform1i(u.ellipse, params.ellipse ? 1 : 0);
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.strength, params.strength * params.strength);
		gl.uniform1i(u.samples, 256);
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.pixelate,
	params: {
		offsetX: {
			label: messages._imageEffector._fxProps.offset + ' X',
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		offsetY: {
			label: messages._imageEffector._fxProps.offset + ' Y',
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		scaleX: {
			label: messages._imageEffector._fxProps.scale + ' W',
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		scaleY: {
			label: messages._imageEffector._fxProps.scale + ' H',
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		ellipse: {
			label: messages._imageEffector._fxProps.circle,
			type: 'boolean',
			default: false,
		},
		angle: {
			label: messages._imageEffector._fxProps.angle,
			type: 'number',
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 90) + '°',
		},
		strength: {
			label: messages._imageEffector._fxProps.strength,
			type: 'number',
			default: 0.2,
			min: 0.0,
			max: 0.5,
			step: 0.01,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
