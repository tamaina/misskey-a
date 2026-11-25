/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { computed, ref, watch, nextTick } from 'vue';
import ts from 'typescript';
import { expect, test } from 'vitest';

const directory = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(directory, '../../frontend/components/MkPostForm.vue'), 'utf8');
const script = source.match(/<script lang="ts" setup>([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('Missing actual post form setup');
const ast = ts.createSourceFile('post-form.ts', script, ts.ScriptTarget.Latest, true);

function actualStatement(name: string): string {
	const node = ast.statements.find(node =>
		(ts.isFunctionDeclaration(node) && node.name?.text === name) ||
		(ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === name)));
	if (!node) throw new Error(`Missing post form statement: ${name}`);
	return node.getText(ast);
}

const policyWatcher = ast.statements.find(node => ts.isExpressionStatement(node) && node.getText(ast).startsWith('watch([postAccountPolicies, localOnly]'));
if (!policyWatcher) throw new Error('Missing federation watcher');
const policyWatcherSource = policyWatcher.getText(ast);
const defaults = { canNote: true, renotePolicy: 'allow', canCreateSpecifiedNote: true, canFederateNote: true, noteFilesLimit: 16, scheduledNoteLimit: 1 };

function fixture(policies = defaults) {
	const locals = {
		computed, ref, watch, $i: { policies }, props: { mock: false }, localOnly: ref(false), visibility: ref('public'),
		scheduledAt: ref<number | null>(null), serverDraftId: ref<string | null>(null), posting: ref(false), posted: ref(false), textLength: ref(5), files: ref<unknown[]>([]), renoteTargetNote: ref<object | null>(null), quoteId: ref<string | null>(null),
		maxTextLength: ref(3000), useCw: ref(false), cw: ref<string | null>(null), cwTextLength: ref(0), maxCwTextLength: 100, poll: ref<{ choices: string[] } | null>(null),
		uploader: { uploading: ref(false), items: ref<unknown[]>([]), readyForUpload: ref(true) },
	};
	const result: { postAccount?: ReturnType<typeof ref<{ policies: typeof defaults } | null>>; canPost?: ReturnType<typeof computed<boolean>>; post?: () => Promise<void>; saveServerDraft?: () => Promise<void> } = {};
	const declarations = ['postAccount', 'postAccountPolicies', 'canPost', 'post', 'saveServerDraft'].map(actualStatement).join('\n');
	runInNewContext(ts.transpile(declarations + '\n' + policyWatcherSource + '\nresult.postAccount = postAccount; result.canPost = canPost; result.post = post; result.saveServerDraft = saveServerDraft;'), { ...locals, result });
	if (!result.postAccount || !result.canPost || !result.post || !result.saveServerDraft) throw new Error('Missing setup values');
	return { ...locals, postAccount: result.postAccount, canPost: result.canPost, post: result.post, saveServerDraft: result.saveServerDraft };
}

test('selected posting account controls note, specified visibility and attachment permission', async () => {
	const f = fixture(); expect(f.canPost.value).toBe(true);
	f.postAccount.value = { policies: { ...defaults, canNote: false } }; expect(f.canPost.value).toBe(false);
	await expect(f.post()).resolves.toBeUndefined();
	f.postAccount.value = { policies: { ...defaults, canCreateSpecifiedNote: false, noteFilesLimit: 0 } }; f.visibility.value = 'specified'; expect(f.canPost.value).toBe(false);
	f.visibility.value = 'public'; expect(f.canPost.value).toBe(true);
	f.files.value.push({}); expect(f.canPost.value).toBe(false);
	f.postAccount.value = null; expect(f.canPost.value).toBe(true);
});
test.each(['renoteOnly', 'disallow'])('restored draft quoteId denied by %s', renotePolicy => {
	const f = fixture({ ...defaults, renotePolicy }); f.quoteId.value = 'target1'; expect(f.canPost.value).toBe(false);
});
test('queued uploads and existing attachments count against the same boundary', () => {
	const f = fixture({ ...defaults, noteFilesLimit: 1 }); f.files.value.push({}); expect(f.canPost.value).toBe(true);
	f.uploader.items.value.push({}); expect(f.canPost.value).toBe(false);
});
test('account switch and later draft restoration both force localOnly', async () => {
	const f = fixture(); f.postAccount.value = { policies: { ...defaults, canFederateNote: false } }; await nextTick(); expect(f.localOnly.value).toBe(true);
	f.localOnly.value = false; await nextTick(); expect(f.localOnly.value).toBe(true); expect(f.canPost.value).toBe(true);
});
test('prohibited-word API UUID resolves localized error description', () => {
	const messages = readFileSync(resolve(directory, '../../frontend/posting-policy-messages.vue'), 'utf8');
	const locale = JSON.parse(messages.match(/<locale lang="json" locale="en-US">([\s\S]*?)<\/locale>/)?.[1] ?? '{}');
	const result: { description?: string } = {};
	runInNewContext(ts.transpile(actualStatement('getErrorDescription') + "\nresult.description = getErrorDescription('aa6e01d3-a85c-669d-758a-76aab43af334');"), { PostingPolicyMessages: { $locale: locale }, result });
	expect(result.description).toBe(locale.noteCreateErrors.containsProhibitedWordsDescription);
});

test('cross-account schedules and restored server drafts cannot use the current account token', async () => {
	const f = fixture({ ...defaults, scheduledNoteLimit: 0 });
	f.postAccount.value = { policies: defaults }; f.scheduledAt.value = Date.now() + 60000;
	expect(f.canPost.value).toBe(false); await expect(f.saveServerDraft()).resolves.toBeUndefined();
	f.scheduledAt.value = null; f.serverDraftId.value = 'current-account-draft'; expect(f.canPost.value).toBe(false);
	f.serverDraftId.value = null; expect(f.canPost.value).toBe(true);
});
