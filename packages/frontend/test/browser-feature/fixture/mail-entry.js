/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Mail from '@features/email/frontend/pages/mail.vue';

const query = new URL(window.location.href).searchParams;
const app = createApp(Mail, { verify: query.get('verify') ?? undefined });
const locale = createInternationalization({ initialLocale: 'ja-JP' });
await locale.ready;
await locale.loadLocale('ja-JP');
app.use(locale);
app.mount('#app');
