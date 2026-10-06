/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** Feature sources consume the host's packages without overriding transitive versions. */
export function pluginFeatureDependencies(frontendRoot: string, featuresRoot: string): Plugin {
	const featurePrefix = resolve(featuresRoot).replaceAll('\\', '/') + '/';
	const hostImporter = resolve(frontendRoot, 'package.json');
	return {
		name: 'feature-host-dependencies',
		enforce: 'pre',
		async resolveId(source, importer, options) {
			if (!importer?.replaceAll('\\', '/').startsWith(featurePrefix)) return null;
			if (source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')
				|| /^[a-z][a-z0-9+.-]*:/i.test(source) || source.startsWith('@/')
				|| source.startsWith('@@/') || source.startsWith('@features/')) return null;
			return this.resolve(source, hostImporter, { ...options, skipSelf: true });
		},
	};
}
