/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './grayscale.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@features/drive/frontend/utility/ImageCompositor.js';
import { getImageEffectorMessages } from './locale.js';

const messages = getImageEffectorMessages();

export const fn = defineImageCompositorFunction({
	shader,
	main: ({ gl, u, params }) => {
	},
});

export const uiDefinition = {
	name: messages._imageEffector._fxs.grayscale,
	params: {
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
