/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { computed, reactive } from 'vue';
import ts from 'typescript';
import { expect, test, vi } from 'vitest';

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../frontend/composables/use-note.ts'), 'utf8');
const ast = ts.createSourceFile('use-note.ts', source, ts.ScriptTarget.Latest, true);
const useNote = ast.statements.find((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === 'useNote');
if (!useNote?.body) throw new Error('Missing actual useNote body');
const declarations = useNote.body.statements.filter(node =>
	(ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === 'canReply')) ||
	(ts.isFunctionDeclaration(node) && node.name?.text === 'reply'));
if (declarations.length !== 2) throw new Error('Missing actual reply guard/action');

function fixture(author: string, mentionLimit: number, canNote = true, signedIn = true) {
	const account = reactive({ id: 'self', policies: { canNote, mentionLimit } });
	const appearNote = { userId: author, channel: null };
	const post = vi.fn().mockResolvedValue(undefined);
	const result = {} as { canReply: ReturnType<typeof computed<boolean>>; reply: () => Promise<void> };
	runInNewContext(ts.transpile(declarations.map(node => node.getText(ast)).join('\n') + '\nresult.canReply = canReply; result.reply = reply;'), {
		computed, $i: signedIn ? account : null, appearNote, props: { mock: false },
		pleaseLogin: async () => signedIn, pleaseLoginContext: {}, os: { post }, focus: vi.fn(), result,
	});
	return { ...result, account, appearNote, post };
}

test.each([
	['self', 0, true, true], ['other', 0, true, false],
	['self', 1, true, true], ['other', 1, true, true], ['other', 20, true, true],
	['self', 0, false, false], ['self', 1, false, false], ['other', 1, false, false],
] as const)('reply to %s with mentionLimit=%i and canNote=%s: %s', async (author, limit, canNote, allowed) => {
	const f = fixture(author, limit, canNote);
	expect(f.canReply.value).toBe(allowed);
	await f.reply();
	expect(f.post).toHaveBeenCalledTimes(allowed ? 1 : 0);
	if (allowed) expect(f.post).toHaveBeenCalledWith({ reply: f.appearNote, channel: null });
});

test('reply availability follows current policy changes', () => {
	const f = fixture('other', 0);
	expect(f.canReply.value).toBe(false);
	f.account.policies.mentionLimit = 1;
	expect(f.canReply.value).toBe(true);
	f.account.policies.canNote = false;
	expect(f.canReply.value).toBe(false);
});

test('signed-out reply keeps the login path without posting', async () => {
	const f = fixture('other', 0, true, false);
	expect(f.canReply.value).toBe(true);
	await f.reply();
	expect(f.post).not.toHaveBeenCalled();
});
