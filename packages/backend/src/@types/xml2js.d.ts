/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module 'xml2js' {
	// Options used by the backend, including rss-parser's XML options.
	export type Options = {
		async?: boolean;
		xmlns?: boolean;
		explicitChildren?: boolean;
		preserveChildrenOrder?: boolean;
	};

	export function parseStringPromise(xml: string, options?: Options): Promise<unknown>;
}
