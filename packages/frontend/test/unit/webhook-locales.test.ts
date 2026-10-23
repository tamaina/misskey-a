/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from 'vue';
import { parse } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { languages } from 'i18n';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createComponentLocale } from 'vite-vue-internationalization/runtime';
import { webhookEventTypes } from '../../../features/integrations/backend/webhook-events.schema.js';
import { restoreUpstreamDevelopBaseline } from './upstream-develop-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');
const owners = ['new', 'edit'].map(kind => {
	const file = `packages/features/integrations/frontend/pages/settings/webhook.${kind}.vue`;
	const source = readFileSync(resolve(root, file), 'utf8');
	const blocks = parse(source).descriptor.customBlocks.filter(block => block.type === 'locale');
	return { kind, file, source, dictionaries: new Map(blocks.map(block => [String(block.attrs.locale), JSON.parse(block.content) as Record<string, string>])) };
});

// Existing editor switches keep their original labels and test buttons.
const existingEvents = new Set(['follow', 'followed', 'note', 'reply', 'renote', 'reaction', 'mention']);

test('webhook event labels resolve through real VVI dictionaries in every supported language', async () => {
	for (const language of languages) {
		const runtime = createInternationalization({ initialLocale: language });
		await runtime.ready;
		runtime.install(createApp({}));
		for (const owner of owners) {
			const actual = createComponentLocale(owner.file.replace('packages/', '/'));
			const primary = owner.dictionaries.get('ja-JP')!;
			const translated = owner.dictionaries.get(language)!;
			for (const event of webhookEventTypes) {
				const key = owner.kind === 'edit' && existingEvents.has(event) ? `webhookSettingsEvents${event[0].toUpperCase()}${event.slice(1)}` : event;
				expect(actual[key]).toBe(translated[key] ?? primary[key]);
				expect(typeof actual[key]).toBe('string');
				expect(actual[key]).not.toBe('');
			}
			expect(actual.eventsDescription).toBe(primary.eventsDescription);
		}
	}
});

test('historical webhook source restoration rejects unreviewed edits', () => {
	const owner = owners.find(owner => owner.kind === 'edit')!;
	expect(restoreUpstreamDevelopBaseline(owner.file, owner.source)).not.toBe(owner.source);
	expect(() => restoreUpstreamDevelopBaseline(owner.file, owner.source + '\n')).toThrow('Source differs from reviewed');
});
