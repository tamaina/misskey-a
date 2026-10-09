/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module '@features/preferences/frontend/themes/*.json5' {
	import { Theme } from '@features/preferences/frontend/shared/theme.js';

	const theme: Theme;

	// eslint-disable-next-line import/no-default-export
	export default theme;
}
