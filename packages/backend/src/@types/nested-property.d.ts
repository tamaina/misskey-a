/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The package ships index.d.ts without a types field. Keep its declaration owned here.
declare module 'nested-property' {
	import nestedProperty = require('nested-property/index.js'); // eslint-disable-line @typescript-eslint/no-require-imports -- Match the dependency's export assignment.
	export = nestedProperty;
}
