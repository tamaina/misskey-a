/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { vueInternationalization } from 'vite-vue-internationalization';

/** Keep VVI 1.1.3 from replacing an SFC dictionary with a style/template fragment. */
export function pluginVvi() {
	const plugin = vueInternationalization({ primaryLocale: 'ja-JP', scan: { include: ['src/**/*.vue', '../features/*/frontend/**/*.vue'] } });
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
