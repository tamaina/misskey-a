/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// JUICE: MFMの「○○ 検索」(検索窓)で使う検索エンジン。ユーザーが設定で選べる

export const SEARCH_ENGINES = {
	google: { name: 'Google', url: 'https://www.google.com/search?q={query}' },
	yahoo: { name: 'Yahoo!', url: 'https://search.yahoo.com/search?p={query}' },
	yahooJapan: { name: 'Yahoo! JAPAN', url: 'https://search.yahoo.co.jp/search?p={query}' },
	bing: { name: 'Bing', url: 'https://www.bing.com/search?q={query}' },
	duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}' },
	kagi: { name: 'Kagi', url: 'https://kagi.com/search?q={query}' },
	brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q={query}' },
	startpage: { name: 'Startpage', url: 'https://www.startpage.com/do/search?query={query}' },
	ecosia: { name: 'Ecosia', url: 'https://www.ecosia.org/search?q={query}' },
	perplexity: { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q={query}' },
} as const satisfies Record<string, { name: string; url: string }>;

export type SearchEngineId = keyof typeof SEARCH_ENGINES | 'custom';

export const SEARCH_ENGINE_IDS = Object.keys(SEARCH_ENGINES) as (keyof typeof SEARCH_ENGINES)[];

// 検査のために{query}の代わりに入れる文字(ホスト名などに紛れ込まないよう、普通の文字の並びにしない)
const QUERY_PROBE = 'juice-query-probe-7f3a';

/**
 * カスタムの検索URLとして使えるか(http/httpsで、検索語を入れる場所の{query}がパス・クエリ・フラグメントにある)
 */
export function isValidCustomSearchUrl(url: unknown): url is string {
	// Explicitly reject control characters instead of accepting URL parser stripping.
	// eslint-disable-next-line no-control-regex
	if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || /[\u0000-\u001f\u007f]/.test(url) || !url.includes('{query}')) return false;
	try {
		const parsed = new URL(url.replace(/\{query\}/g, QUERY_PROBE));
		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
		// ホスト名などに{query}があると、日本語などの検索語で開けないURLになる
		if (parsed.host.includes(QUERY_PROBE) || parsed.username !== '' || parsed.password !== '') return false;
		return true;
	} catch {
		return false;
	}
}

// 保存してある値が一覧に無いもの(書き換えられた等)でも落ちないよう、一覧にあるものだけを使う
function builtinEngine(engine: unknown): { name: string; url: string } {
	return typeof engine === 'string' && Object.hasOwn(SEARCH_ENGINES, engine) ? SEARCH_ENGINES[engine as keyof typeof SEARCH_ENGINES] : SEARCH_ENGINES.google;
}

/**
 * 検索語から、選んでいる検索エンジンで検索するURLを作る。カスタムのURLが使えないときはGoogleにする
 */
export function buildSearchUrl(engine: unknown, customUrl: unknown, query: string): string {
	const encoded = encodeURIComponent(query.toWellFormed());
	if (engine === 'custom' && isValidCustomSearchUrl(customUrl)) return new URL(customUrl.replace(/\{query\}/g, encoded)).href;
	return builtinEngine(engine).url.replace('{query}', encoded);
}

/**
 * 検索ボタンに出す検索エンジンの名前(カスタムならURLのホスト名)
 */
export function searchEngineName(engine: unknown, customUrl: unknown): string {
	if (engine === 'custom' && isValidCustomSearchUrl(customUrl)) return new URL(customUrl.replace(/\{query\}/g, QUERY_PROBE)).hostname;
	return builtinEngine(engine).name;
}

