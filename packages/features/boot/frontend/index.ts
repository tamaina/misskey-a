/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type InternationalizationInstance = ReturnType<typeof import('virtual:vite-vue-internationalization').createInternationalization>;

export interface ComponentLocales {
	readonly ready: Promise<unknown>;
	loadLocale(locale: string): Promise<unknown>;
}

export async function startComponentLocales<T extends ComponentLocales>(
	locale: string,
	create: (options: { initialLocale: string }) => T,
	install: (runtime: T) => void,
): Promise<T> {
	const runtime = create({ initialLocale: locale });
	await runtime.ready;
	// VVI 1.1.3 logs initial load errors. Explicitly await a successful load
	// before mounting, so a failed locale request cannot silently render keys.
	await runtime.loadLocale(locale);
	install(runtime);
	return runtime;
}
