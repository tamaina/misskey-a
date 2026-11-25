/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SearchIndexItem } from './vite-plugin-create-search-index.js';

/**
 * TypeScriptコード生成
 */
export function generateSearchIndexModule(resolvedRootMarkers: SearchIndexItem[]): string {
	const serializedMarkers = JSON.stringify(resolvedRootMarkers);
	const componentLocaleImport = serializedMarkers.includes('${createComponentLocale(')
		? `import { createComponentLocale } from 'vite-vue-internationalization/runtime';\n`
		: '';
	const i18nImport = serializedMarkers.includes('${i18n.') || serializedMarkers.includes('${i18n[')
		? `import { i18n } from '@features/runtime/frontend/i18n.js';\n`
		: '';
	return componentLocaleImport
		+ i18nImport
		+ `export const searchIndexes = ${customStringify(resolvedRootMarkers)};\n`;
}

/**
 * オブジェクトを特殊な形式の文字列に変換する
 * i18n参照を保持しつつ適切な形式に変換
 */
function customStringify(obj: unknown): string {
	return JSON.stringify(obj).replaceAll(/"(.*?)"/g, (all, group) => {
		// 静的解析が i18n 参照を "${i18n.xxx}"のような形に変換してるので、これをそのまま`${i18n.xxx}`
		// のような形にすると、実行時にi18nのプロパティにアクセスするようになる。
		// objectのkeyでは``が使えないので、${ が使われている場合にのみ``に置き換えるようにする
		return group.includes('${') ? '`' + group + '`' : all;
	});
}
