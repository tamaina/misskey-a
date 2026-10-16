/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';

const reviewed: Record<string, { current: string; baseline: string }> = {
	'packages/features/web/frontend/pages/about-misskey.vue': {
		current: 'a7da624478011cac555f6e3b8dcdca978b9deac727f00ca3c032d6bccc24902a',
		baseline: '7e9a3358fdd8e36a68cc903c86679f6bc62d4df089919e94e1aca413e71fb0f6',
	},
	'packages/features/instance/frontend/pages/about.overview.vue': {
		current: '341b892892dfb3d820b76cd08b68ff460bee36927c29909fc74f376f68389815',
		baseline: '73b15795650bdca2b452a157749ba3259757c916a2936919fa3797a9e89e59d5',
	},
	'packages/features/boot/frontend/pages/welcome.setup.vue': {
		current: 'fe0288a83b7d0eb29ee74dbe96b0116a60042bb2601cd154c0dae45932a440d6',
		baseline: '7c4b830c23f6483d4995074ab5197770807bb42be1b8f6cfd037575671a2bc8b',
	},
};
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only the reviewed product labels/layout, keeping the migration oracles frozen. */
export function restoreProductNameBaseline(file: string, source: string): string {
	const proof = reviewed[file];
	if (!proof) return source;
	if (sha256(source) !== proof.current) throw new Error(`Product-name source differs: ${file}`);
	source = source.replace('import { host, version, productName }', 'import { host, version }');
	if (file.endsWith('/about-misskey.vue')) {
		source = source.replace('<div class="misskey">{{ productName }}</div>', '<div class="misskey">Misskey</div>')
			.replace('title: interpolateLocaleParameters($locale.value.sfc.aboutMisskey, { productName }),', 'title: $locale.value.sfc.aboutMisskey,');
	} else if (file.endsWith('/about.overview.vue')) {
		source = source.replace('<template #key>{{ productName }}</template>', '<template #key>Misskey</template>')
			.replace('{{ interpolateLocaleParameters($locale.sfc.aboutMisskey, { productName }) }}', '{{ $locale.sfc.aboutMisskey }}');
	} else {
		const begin = source.indexOf('\t\t\t<div :class="$style.header">\n');
		const end = source.indexOf('\t\t\t</div>\n\t\t\t<div style="padding: 16px', begin);
		const header = source.slice(begin, end).split('\n').slice(1).map(line => line.startsWith('\t') ? line.slice(1) : line).join('\n');
		source = source.slice(0, begin) + header + source.slice(end + '\t\t\t</div>\n'.length);
		source = source.replace('Welcome to {{ productName }}!', 'Welcome to Misskey!')
			.replace('.header {\n\tdisplay: grid;\n\n\t> svg {\n\t\tgrid-area: 1 / 1;\n\t\twidth: 100%;\n\t}\n}\n\n.title {\n\tposition: relative;\n\tgrid-area: 1 / 1;', '.title {\n\tposition: absolute;\n\ttop: 16px;\n\tleft: 0;\n\tright: 0;')
			.replace('\tpadding: 48px 32px 32px;\n\tcolor: #fff;', '\tpadding: 32px;\n\tcolor: #fff;');
	}
	if (!file.endsWith('/welcome.setup.vue')) {
		source = source.replace(/("aboutMisskey": "[^"\n]*)\{productName\}/g, '$1Misskey');
	}
	if (sha256(source) !== proof.baseline) throw new Error(`Product-name baseline was not restored: ${file}`);
	return source;
}
