/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

if (import.meta.env.DEV) {
	await import('@tabler/icons-webfont/dist/tabler-icons.scss');
} else {
	await import('icons-subsetter/built/tabler-icons-frontend.css');
}

import '@/style.scss';
import { createInternationalization, setActiveInternationalization } from 'virtual:vite-vue-internationalization';
import { startComponentLocales } from '@features/boot/frontend/index.js';
import { lang } from '@features/boot/frontend/shared/config.js';

const internationalization = await startComponentLocales(lang, createInternationalization, setActiveInternationalization);

const subBootPaths = ['/share', '/auth', '/miauth', '/oauth', '/signup-complete', '/verify-email', '/install-extensions'];

if (subBootPaths.some(i => window.location.pathname === i || window.location.pathname.startsWith(i + '/'))) {
	const { subBoot } = await import('@features/boot/frontend/boot/sub-boot.js');
	await subBoot(internationalization);
} else {
	const { mainBoot } = await import('@features/boot/frontend/boot/main-boot.js');
	await mainBoot(internationalization);
}
