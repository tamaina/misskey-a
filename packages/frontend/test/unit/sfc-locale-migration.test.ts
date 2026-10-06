/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { languages, locales } from 'i18n';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

const migrations = [
	{ file: 'packages/features/auth/frontend/components/MkSigninDialog.vue', keyPath: 'login' },
	{ file: 'packages/features/auth/frontend/components/MkSignupDialog.vue', keyPath: 'signup' },
	{ file: 'packages/features/auth/frontend/pages/miauth.vue', keyPath: '_auth.byClickingYouWillBeRedirectedToThisUrl' },
	{ file: 'packages/features/chat/frontend/pages/chat/home.joiningRooms.vue', keyPath: '_chat.noRooms' },
	{ file: 'packages/features/chat/frontend/pages/chat/home.ownedRooms.vue', keyPath: '_chat.noRooms' },
	{ file: 'packages/features/discovery/frontend/components/MkAutocomplete.vue', keyPath: 'selectUser' },
	{ file: 'packages/features/drive/frontend/components/MkDrive.navFolder.vue', keyPath: 'drive' },
	{ file: 'packages/features/drive/frontend/components/MkDriveWindow.vue', keyPath: 'drive' },
	{ file: 'packages/features/drive/frontend/pages/admin-file.chat.vue', keyPath: '_fileViewer.thisPageCanBeSeenFromTheAuthor' },
	{ file: 'packages/features/drive/frontend/pages/drive.file.notes.vue', keyPath: '_fileViewer.thisPageCanBeSeenFromTheAuthor' },
	{ file: 'packages/features/emojis/frontend/components/MkEmojiPicker.section.vue', keyPath: 'other' },
	{ file: 'packages/features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.logs.vue', keyPath: '_customEmojisManager._gridCommon.registrationLogs' },
	{ file: 'packages/features/markup/frontend/components/MkCodeEditor.vue', keyPath: 'save' },
	{ file: 'packages/features/media/frontend/components/MkImageEffectorFxForm.vue', keyPath: 'nothingToConfigure' },
	{ file: 'packages/features/navigation/frontend/components/MkSuperMenu.vue', keyPath: 'search' },
	{ file: 'packages/features/notes/frontend/components/MkNoteSimple.vue', keyPath: 'deletedNote' },
	{ file: 'packages/features/notes/frontend/components/MkPostForm.TextCounter.vue', keyPath: 'textCount' },
	{ file: 'packages/features/operations/frontend/pages/admin/federation-job-queue.chart.vue', keyPath: 'noJobs' },
	{ file: 'packages/features/pages/frontend/pages/page-editor/els/page-editor.el.image.vue', keyPath: '_pages.blocks.image' },
	{ file: 'packages/features/pages/frontend/pages/page-editor/els/page-editor.el.text.vue', keyPath: '_pages.blocks.text' },
	{ file: 'packages/features/roles/frontend/pages/explore.roles.vue', keyPath: 'noRole' },
	{ file: 'packages/features/timelines/frontend/components/MkNotesTimeline.vue', keyPath: 'noNotes' },
	{ file: 'packages/features/ui/frontend/components/MkContainer.vue', keyPath: 'showMore' },
	{ file: 'packages/features/ui/frontend/components/MkInput.vue', keyPath: 'save' },
	{ file: 'packages/features/ui/frontend/components/MkKeyValue.vue', keyPath: 'copy' },
	{ file: 'packages/features/ui/frontend/components/MkMenu.vue', keyPath: 'none' },
	{ file: 'packages/features/ui/frontend/components/MkModalWindow.vue', keyPath: 'done' },
	{ file: 'packages/features/ui/frontend/components/MkOmit.vue', keyPath: 'showMore' },
	{ file: 'packages/features/users/frontend/components/MkAccountMoved.vue', keyPath: 'accountMoved' },
	{ file: 'packages/features/users/frontend/pages/user/raw.vue', keyPath: 'createdAt' },
	{ file: 'packages/frontend/src/components/MkCropperDialog.vue', keyPath: 'cropImage' },
	{ file: 'packages/frontend/src/components/MkGoogle.vue', keyPath: 'searchByGoogle' },
	{ file: 'packages/frontend/src/components/MkUserList.vue', keyPath: 'noUsers' },
	{ file: 'packages/frontend/src/ui/deck/direct-column.vue', keyPath: '_deck._columns.direct' },
	{ file: 'packages/frontend/src/ui/deck/mentions-column.vue', keyPath: '_deck._columns.mentions' },
	{ file: 'packages/frontend/src/ui/visitor.vue', keyPath: 'signup' },
	{ file: 'packages/frontend/src/ui/zen.vue', keyPath: 'goToDeck' },
] as const;

function getLocaleValue(locale: string, keyPath: string): unknown {
	return keyPath.split('.').reduce<unknown>((value, key) => {
		if (value === null || typeof value !== 'object') return undefined;
		return (value as Record<string, unknown>)[key];
	}, locales[locale]);
}

describe('SFC-local locale migration', () => {
	test.each(migrations)('$file preserves all effective translations', ({ file, keyPath }) => {
		const source = readFileSync(resolve(repoRoot, file), 'utf8');
		const localKey = keyPath.split('.').at(-1)!;
		const localReference = `$locale.sfc.${localKey}`;
		const oldReference = `i18n.ts.${keyPath}`;
		const localeBlocks = new Map<string, Record<string, unknown>>();

		for (const match of source.matchAll(/<locale\s+locale="([^"]+)"\s+lang="json">([\s\S]*?)<\/locale>/g)) {
			expect(localeBlocks.has(match[1])).toBe(false);
			localeBlocks.set(match[1], JSON.parse(match[2]) as Record<string, unknown>);
		}

		expect([...localeBlocks.keys()]).toEqual(languages);
		expect(source.split(oldReference).length - 1).toBe(0);
		expect(source.split(localReference).length - 1).toBe(1);

		for (const language of languages) {
			const actual = localeBlocks.get(language)?.[localKey];
			const expected = getLocaleValue(language, keyPath);
			expect(typeof actual).toBe('string');
			expect(actual).toBe(expected);
		}
	});
});
