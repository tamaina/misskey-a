/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { vueInternationalization } from 'vite-vue-internationalization';

/** Keep VVI 1.1.3 from replacing an SFC dictionary with a style/template fragment. */
export function pluginVvi() {
	const plugin = vueInternationalization({ primaryLocale: 'ja-JP', scan: { include: ['features/*/frontend/**/*.vue'] } });
	const configure = plugin.configResolved;
	if (typeof configure !== 'function') throw new Error('Unexpected VVI config hook; review the feature scan root on upgrade.');
	plugin.configResolved = function (config) {
		// VVI scans descendants of its root, regardless of ../ include globs.
		// Use packages/ only for localization; the actual Vite root stays frontend/.
		return configure.call(this, { ...config, root: resolve(config.root, '..') });
	};
	const transform = plugin.transform;
	if (!transform || typeof transform === 'function') throw new Error('Unexpected VVI transform hook; review the subrequest guard on upgrade.');
	plugin.transform = {
		...transform,
		handler(code, id, ...args) {
			// The complete SFC has already been scanned/transformed. Vue subrequests
			// contain no locale blocks; collecting them deletes the real dictionary.
			if (id.includes('.vue?')) return null;
			return transform.handler.call(this, code, id, ...args);
		},
	};
	return plugin;
}
