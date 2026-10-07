/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Reuse the installed backend-owned @types declaration and its export assignment.
declare module 'http-link-header' {
	import Link = require('http-link-header/index.js'); // eslint-disable-line @typescript-eslint/no-require-imports -- Match the dependency's export assignment.
	export = Link;
}
