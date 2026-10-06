/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import sharedConfig from '../../shared/eslint.config.js';

export default [
	...sharedConfig,
	{ ignores: ['built/**'] },
];
