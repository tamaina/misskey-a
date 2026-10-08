/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './polkadot.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction<{
	angle: number;
	scale: number;
	majorRadius: number;
	majorOpacity: number;
	minorDivisions: number;
	minorRadius: number;
	minorOpacity: number;
	color: [number, number, number];
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.scale, params.scale * params.scale);
		gl.uniform1f(u.major_radius, params.majorRadius);
		gl.uniform1f(u.major_opacity, params.majorOpacity);
		gl.uniform1f(u.minor_divisions, params.minorDivisions);
		gl.uniform1f(u.minor_radius, params.minorRadius);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.minor_opacity, params.minorOpacity);
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.polkadot,
	params: {
		angle: {
			label: messages._imageEffector._fxProps.angle,
			type: 'number',
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 90) + '°',
		},
		scale: {
			label: messages._imageEffector._fxProps.scale,
			type: 'number',
			default: 3.0,
			min: 1.0,
			max: 10.0,
			step: 0.1,
		},
		majorRadius: {
			label: messages._watermarkEditor.polkadotMainDotRadius,
			type: 'number',
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		majorOpacity: {
			label: messages._watermarkEditor.polkadotMainDotOpacity,
			type: 'number',
			default: 0.75,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		minorDivisions: {
			label: messages._watermarkEditor.polkadotSubDotDivisions,
			type: 'number',
			default: 4,
			min: 0,
			max: 16,
			step: 1,
		},
		minorRadius: {
			label: messages._watermarkEditor.polkadotSubDotRadius,
			type: 'number',
			default: 0.25,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		minorOpacity: {
			label: messages._watermarkEditor.polkadotSubDotOpacity,
			type: 'number',
			default: 0.5,
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
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
