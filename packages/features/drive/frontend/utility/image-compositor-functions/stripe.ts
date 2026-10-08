/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './stripe.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction<{
	angle: number;
	frequency: number;
	threshold: number;
	color: [number, number, number];
	opacity: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.frequency, params.frequency * params.frequency);
		gl.uniform1f(u.phase, 0.0);
		gl.uniform1f(u.threshold, params.threshold);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.opacity, params.opacity);
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.stripe,
	params: {
		angle: {
			label: messages._imageEffector._fxProps.angle,
			type: 'number',
			default: 0.5,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 90) + '°',
		},
		frequency: {
			label: messages._watermarkEditor.stripeFrequency,
			type: 'number',
			default: 10.0,
			min: 1.0,
			max: 30.0,
			step: 0.1,
		},
		threshold: {
			label: messages._watermarkEditor.stripeWidth,
			type: 'number',
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		color: {
			label: messages._imageEffector._fxProps.color,
			type: 'color',
			default: [1, 1, 1],
		},
		opacity: {
			label: messages._imageEffector._fxProps.opacity,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
