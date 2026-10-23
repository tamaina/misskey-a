/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { basename, resolve } from 'node:path';
import { collectModifications } from '../../frontend-builder/locale-inliner/collect-modifications.js';
import { detectI18nFacadeChunk } from '../../frontend-builder/locale-inliner/facade-chunk-detection.js';
import { createLogger } from '../../frontend-builder/logger.js';
import type { Plugin } from 'vite';

/** Keep the former inliner's label check without rewriting or copying chunks. */
export function assertNoLegacyLabels(chunks: readonly { fileName: string; code: string }[], entryFile: string): void {
	const logger = createLogger();
	const entry = chunks.find(chunk => chunk.fileName === entryFile);
	if (!entry) throw new Error('Missing legacy i18n entry for label validation');
	const facade = detectI18nFacadeChunk(entry.code, basename(entryFile), logger);
	const context = {
		scriptsDir: 'scripts',
		i18nFileName: facade?.fileName ?? basename(entryFile),
		i18nSymbol: facade ? facade.nameMap.i18n : 'i18n',
	};
	if (!context.i18nSymbol) throw new Error('Missing legacy i18n facade export');
	for (const chunk of chunks) {
		if (facade && chunk === entry) continue;
		const modifications = collectModifications(chunk.code, basename(chunk.fileName), logger.prefixed(chunk.fileName), { ...context, i18nSymbol: context.i18nSymbol });
		if (modifications.some(item => item.type === 'localized' || item.type === 'parameterized-function')) {
			throw new Error(`Legacy labels remain in a VVI-only locale build: ${chunk.fileName}`);
		}
	}
	if (logger.errorCount > 0) throw new Error('Legacy label validation failed');
}

export function pluginNoLegacyLabels(): Plugin {
	let entryId: string;
	return {
		name: 'misskey-no-legacy-labels',
		apply: 'build',
		configResolved(config) {
			entryId = resolve(config.root, '../features/runtime/frontend/i18n.ts');
		},
		generateBundle(_options, bundle) {
			const chunks = Object.values(bundle).filter(item => item.type === 'chunk');
			const entry = chunks.find(chunk => chunk.facadeModuleId === entryId);
			if (!entry) throw new Error('Missing legacy i18n build input');
			assertNoLegacyLabels(chunks, entry.fileName);
		},
	};
}
