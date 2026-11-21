/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { expect, test, vi } from 'vitest';

const source = readFileSync(new URL('../../frontend/utility/get-note-menu.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('get-note-menu.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'getNoteMenu');
if (!declaration) throw new Error('Missing actual note menu');
const menuSource = ts.transpile(declaration.getText(ast).replace(/^export /, '') + '\nresult.getNoteMenu = getNoteMenu;');

function fixture(canNote: boolean) {
	const account = { id: 'self', policies: { canNote } };
	const note = { id: 'note', userId: 'self', createdAt: '2000-01-01T00:00:00.000Z' };
	const confirm = vi.fn<() => Promise<{ canceled: boolean }>>().mockResolvedValue({ canceled: false });
	const post = vi.fn();
	const api = vi.fn().mockResolvedValue({ isFavorited: false, isMutedThread: false });

	type MenuItem = { text?: string; action?: () => void };
	const result: { getNoteMenu?: (props: { note: typeof note }) => { menu: MenuItem[] } } = {};
	runInNewContext(menuSource, {
		result,
		$i: account,
		prefer: { s: {} },
		getAppearNote: () => note,
		getCopyNoteLinkMenu: () => ({}),
		getNoteEmbedCodeMenu: () => undefined,
		isSupportShare: () => false,
		getPluginHandlers: () => [],
		FeatureLocaleMessages: { $locale: { delete: 'delete', deleteAndEdit: 'deleteAndEdit' } },
		os: { confirm, post },
		misskeyApi: api,
		globalEvents: { emit: vi.fn() },
	});
	if (!result.getNoteMenu) throw new Error('Failed to evaluate the note menu');
	const menu = result.getNoteMenu({ note }).menu;
	const action = (text: string) => menu.find(item => item.text === text)?.action;
	const run = (text: string) => {
		const callback = action(text);
		if (!callback) throw new Error(`Missing menu action: ${text}`);
		callback();
	};
	return { account, note, confirm, post, api, action, run };
}

test('owners without posting permission can delete but cannot delete and edit', async () => {
	const f = fixture(false);
	expect(f.action('deleteAndEdit')).toBeUndefined();
	f.run('delete');
	await Promise.resolve();
	expect(f.api).toHaveBeenCalledWith('notes/delete', { noteId: f.note.id });
	expect(f.post).not.toHaveBeenCalled();
});

test('a stale menu action cannot open confirmation once posting is disabled', () => {
	const f = fixture(true);
	f.account.policies.canNote = false;
	f.run('deleteAndEdit');
	expect(f.confirm).not.toHaveBeenCalled();
	expect(f.api).not.toHaveBeenCalledWith('notes/delete', { noteId: f.note.id });
});

test('confirmation does not delete the original if posting is disabled while it is open', async () => {
	const f = fixture(true);
	const pending = Promise.withResolvers<{ canceled: boolean }>();
	f.confirm.mockReturnValueOnce(pending.promise);
	f.run('deleteAndEdit');
	expect(f.confirm).toHaveBeenCalledTimes(1);
	f.account.policies.canNote = false;
	pending.resolve({ canceled: false });
	await pending.promise;
	expect(f.api).not.toHaveBeenCalledWith('notes/delete', { noteId: f.note.id });
	expect(f.post).not.toHaveBeenCalled();
});

test('delete and edit keeps its existing flow while posting is permitted', async () => {
	const f = fixture(true);
	f.run('deleteAndEdit');
	await Promise.resolve();
	expect(f.api).toHaveBeenCalledWith('notes/delete', { noteId: f.note.id });
	expect(f.post).toHaveBeenCalledWith(expect.objectContaining({ initialNote: f.note }));
});
