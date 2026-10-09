/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { packedPageSchema } from '@features/users/backend/page.schema.js';
import { packedJsonObjectSchema as packedPageBlockSchema } from '@features/users/backend/json-value.schema.js';
import { MiPage } from '../../backend/models/Page.js';
import { PageLikeEntityService } from '../../backend/serializers/PageLikeEntityService.js';
import { PageEntityService } from '../../backend/serializers/PageEntityService.js';
import { PagesShowApplicationService } from '../../backend/applications/pages/show.js';
import { iPageLikesContract } from '../../backend/endpoints/i/page-likes.contract.js';

import { iPagesContract } from '../../backend/endpoints/i/pages.contract.js';
import { pagesFeaturedContract } from '../../backend/endpoints/pages/featured.contract.js';
import { usersPagesContract } from '../../backend/endpoints/users/pages.contract.js';
import { pagePushContract } from '../../backend/endpoints/page-push.contract.js';
import { pagesDeleteContract } from '../../backend/endpoints/pages/delete.contract.js';
import { pagesLikeContract } from '../../backend/endpoints/pages/like.contract.js';
import { pagesUnlikeContract } from '../../backend/endpoints/pages/unlike.contract.js';
import { pagesCreateContract } from '../../backend/endpoints/pages/create.contract.js';
import { pagesUpdateContract } from '../../backend/endpoints/pages/update.contract.js';
import { pagesShowContract } from '../../backend/endpoints/pages/show.contract.js';
import type { MiPageLike } from '../../backend/models/PageLike.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import type { packedDriveFileSchema } from '@features/notes/backend/drive.schema.js';
import type { PackedUserLite } from '@features/users/backend/user.schema.js';
const voidPagePushInput = requiredSchema(pagePushContract['~orpc'].inputSchema);
const selectorPagesShowInput = requiredSchema(pagesShowContract['~orpc'].inputSchema);

function requiredSchema<T>(schema: T | undefined): T {
	if (schema === undefined) throw new Error('Expected contract schema');
	return schema;
}

const packedIPageLikesInput = requiredSchema(iPageLikesContract['~orpc'].inputSchema);
const packedIPageLikesOutput = requiredSchema(iPageLikesContract['~orpc'].outputSchema);
const packedIPagesInput = requiredSchema(iPagesContract['~orpc'].inputSchema);
const packedPagesFeaturedInput = requiredSchema(pagesFeaturedContract['~orpc'].inputSchema);
const packedUsersPagesInput = requiredSchema(usersPagesContract['~orpc'].inputSchema);
const voidPagesDeleteInput = requiredSchema(pagesDeleteContract['~orpc'].inputSchema);
const voidPagesLikeInput = requiredSchema(pagesLikeContract['~orpc'].inputSchema);
const voidPagesUnlikeInput = requiredSchema(pagesUnlikeContract['~orpc'].inputSchema);
const portablePagesCreateInput = requiredSchema(pagesCreateContract['~orpc'].inputSchema);
const portablePagesUpdateInput = requiredSchema(pagesUpdateContract['~orpc'].inputSchema);

const date = new Date('2026-01-01T00:00:00Z');
const user: PackedUserLite = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' };
const file: v.InferOutput<typeof packedDriveFileSchema> = { id: 'file123', createdAt: date.toISOString(), name: 'image.png', type: 'image/png', md5: 'hash', size: 1, isSensitive: false, blurhash: null, properties: {}, url: 'https://example/image.png', thumbnailUrl: null, comment: null, folderId: null, userId: user.id };

function fixture() {
	const pages = mockDeep<ConstructorParameters<typeof PageEntityService>[0]>();
	const likes = mockDeep<ConstructorParameters<typeof PageEntityService>[1]>();
	likes.exists.mockResolvedValue(false);
	const files = mockDeep<ConstructorParameters<typeof PageEntityService>[2]>();
	const users = mockDeep<ConstructorParameters<typeof PageEntityService>[3]>();
	users.pack.mockResolvedValue(user);
	users.packMany.mockResolvedValue([user]);
	const drive = mockDeep<ConstructorParameters<typeof PageEntityService>[4]>();
	drive.pack.mockResolvedValue(file);
	drive.packMany.mockResolvedValue([]);
	const ids = mockDeep<ConstructorParameters<typeof PageEntityService>[5]>();
	ids.parse.mockReturnValue({ date });
	const service = new PageEntityService(pages, likes, files, users, drive, ids);
	const page = new MiPage({ id: 'page123', updatedAt: date, title: 'Page', name: 'page', summary: null, userId: user.id, user: null, content: [], variables: [], script: '', eyeCatchingImageId: null, eyeCatchingImage: null, hideTitleWhenPinned: false, alignCenter: false, font: 'sans-serif', likedCount: 0, visibility: 'public', visibleUserIds: [] });
	pages.findOneByOrFail.mockResolvedValue(page);
	return { service, page, pages, likes, files, drive, users };
}

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

test('actual Page serializer has a finite anonymous and viewer envelope', async () => {
	const { service, page, likes, users } = fixture();
	const anonymous = await service.pack(page.id);
	checkClosed(packedPageSchema, anonymous, 'title', { font: 'monospace' });
	expect(Object.keys(anonymous).sort()).toEqual(['id', 'createdAt', 'updatedAt', 'userId', 'user', 'content', 'variables', 'title', 'name', 'summary', 'hideTitleWhenPinned', 'alignCenter', 'font', 'script', 'eyeCatchingImageId', 'eyeCatchingImage', 'attachedFiles', 'likedCount', 'isLiked'].sort());
	expect(anonymous.summary).toBeNull();
	expect(anonymous.eyeCatchingImage).toBeNull();
	expect(Object.hasOwn(anonymous, 'isLiked')).toBe(true);
	expect(v.parse(packedPageSchema, anonymous).isLiked).toBeUndefined();
	expect(likes.exists).not.toHaveBeenCalled();
	const unliked = await service.pack(page, user);
	expect(v.parse(packedPageSchema, unliked).isLiked).toBe(false);
	likes.exists.mockResolvedValue(true);
	const liked = (await service.packMany([page], user))[0];
	expect(v.parse(packedPageSchema, liked).isLiked).toBe(true);
	expect(likes.exists).toHaveBeenLastCalledWith({ where: { pageId: page.id, userId: user.id } });
	expect(users.packMany).toHaveBeenCalledWith([user.id], user);
	for (const wrong of [{ summary: 7 }, { eyeCatchingImage: 7 }, { isLiked: null }, { attachedFiles: [null] }, { content: [7] }, { variables: [null] }]) expect(v.safeParse(packedPageSchema, { ...anonymous, ...wrong }).success).toBe(false);
});

test('actual Page serializer collects nested files, excludes deleted files and populates its image', async () => {
	const { service, page, files, drive } = fixture();
	const storedFile = mockDeep<MiDriveFile>({ id: file.id, userId: user.id });
	files.findOneBy.mockImplementation(async criteria => !Array.isArray(criteria) && criteria.id === file.id ? storedFile : null);
	drive.packMany.mockImplementation(async found => {
		expect(found).toEqual([storedFile]);
		return [file];
	});
	page.eyeCatchingImageId = file.id;
	page.content = [{ id: 'section', type: 'section', title: 'Images', extension: true, children: [{ id: 'image', type: 'image', fileId: file.id, caption: 'retained' }, { id: 'deleted', type: 'image', fileId: 'deleted123' }] }];
	const packed = await service.pack(page);
	checkClosed(packedPageSchema, packed, 'attachedFiles', { eyeCatchingImageId: 7 });
	expect(packed.eyeCatchingImage).toEqual(file);
	expect(packed.attachedFiles).toEqual([file]);
	expect(packed.content).toEqual(page.content);
	expect(files.findOneBy.mock.calls).toEqual([[{ id: file.id, userId: user.id }], [{ id: 'deleted123', userId: user.id }]]);
	expect(drive.pack).toHaveBeenCalledWith(file.id);
});

test('actual Page serializer preserves stored extensions and variables and migrates legacy inputs', async () => {
	const { service, page, pages } = fixture();
	page.content = [{ id: 'section', type: 'section', title: 'Legacy', extra: { enabled: true }, children: [{ id: 'text', type: 'input', inputType: 'text', default: 'hello', extra: true }, { id: 'number', type: 'input', inputType: 'number', default: '42', extra: true }] }, { type: 'extension', configuration: { arbitrary: [1, null] } }];
	page.variables = [{ name: 'custom', type: 'extension', value: [1, { arbitrary: true }], extra: true }];
	const packed = await service.pack(page);
	expect(v.parse(packedPageSchema, packed).content).toEqual([{ id: 'section', type: 'section', title: 'Legacy', extra: { enabled: true }, children: [{ id: 'text', type: 'textInput', inputType: 'text', default: 'hello', extra: true }, { id: 'number', type: 'numberInput', inputType: 'number', default: 42, extra: true }] }, { type: 'extension', configuration: { arbitrary: [1, null] } }]);
	expect(v.parse(packedPageSchema, packed).variables).toEqual([{ name: 'custom', type: 'extension', value: [1, { arbitrary: true }], extra: true }]);
	expect(pages.update).toHaveBeenCalledWith(page.id, { content: page.content });
});

test('actual PageLike serializer produces the strict id and page wrapper', async () => {
	const { service, page, likes } = fixture();
	const like: MiPageLike = mockDeep<MiPageLike>({ id: 'like123', pageId: page.id, page: null, userId: user.id });
	likes.findOneByOrFail.mockResolvedValue(like);
	const serializer = new PageLikeEntityService(likes, service);
	const packed = await serializer.pack(like.id, user);
	checkClosed(packedIPageLikesOutput.item, packed, 'page', { id: 7 });
	expect(v.parse(packedIPageLikesOutput, [packed])).toEqual([packed]);
	expect(packed.page.isLiked).toBe(false);
	expect(v.safeParse(packedIPageLikesOutput, [{ ...packed, page: { ...packed.page, future: true } }]).success).toBe(false);
	like.page = page;
	expect(await serializer.packMany([like], user)).toEqual([packed]);
});

test('finite native Pages inputs strip extras and retain declared keys and defaults', () => {
	for (const schema of [packedIPageLikesInput, packedIPagesInput]) {
		expect(v.parse(schema, { future: true })).toEqual({ limit: 10 });
		expect(v.parse(schema, { limit: 1, sinceId: 'since123', untilId: 'until123', sinceDate: 0, untilDate: 1, future: true })).toEqual({ limit: 1, sinceId: 'since123', untilId: 'until123', sinceDate: 0, untilDate: 1 });
		for (const input of [null, 7, { limit: 0 }, { limit: 101 }, { limit: 1.5 }, { sinceId: 'bad-id' }, { sinceDate: 1.5 }]) expect(v.safeParse(schema, input).success).toBe(false);
		expect(v.safeParse(schema, []).success).toBe(false);
	}
	expect(v.parse(packedPagesFeaturedInput, { future: true })).toEqual({});
	expect(v.safeParse(packedPagesFeaturedInput, []).success).toBe(false);
	for (const input of [null, 7]) expect(v.safeParse(packedPagesFeaturedInput, input).success).toBe(false);
	expect(v.parse(packedUsersPagesInput, { userId: user.id, future: true })).toEqual({ userId: user.id, limit: 10 });
	for (const input of [{}, [], { userId: 7 }]) expect(v.safeParse(packedUsersPagesInput, input).success).toBe(false);
	for (const schema of [voidPagesDeleteInput, voidPagesLikeInput, voidPagesUnlikeInput]) {
		expect(v.parse(schema, { pageId: 'page123', future: true })).toEqual({ pageId: 'page123' });
		for (const input of [{}, [], null, { pageId: 7 }, { pageId: 'bad-id' }]) expect(v.safeParse(schema, input).success).toBe(false);
	}
	for (const value of [null, 7, 'event', [1, { arbitrary: true }], { arbitrary: true }]) expect(v.parse(voidPagePushInput, { pageId: 'page123', event: 'custom', var: value, future: true })).toEqual({ pageId: 'page123', event: 'custom', var: value });
	expect(v.parse(voidPagePushInput, { pageId: 'page123', event: 'custom', future: true })).toEqual({ pageId: 'page123', event: 'custom' });
	for (const input of [{}, { pageId: 'page123' }, { pageId: 'page123', event: 7 }]) expect(v.safeParse(voidPagePushInput, input).success).toBe(false);
});

test('stored block acceptance and dynamic create, update and show inputs remain unchanged', () => {
	for (const block of [{ id: 'text', type: 'text', text: 'hello', extension: true }, { id: 'section', type: 'section', title: 'section', children: [{ extension: true }], extension: true }, { id: 'legacy', type: 'button', children: [{ extension: true }], extension: true }]) expect(v.parse(packedPageBlockSchema, block)).toEqual(block);
	const dynamic = { title: 'Page', name: 'page', content: [{ type: 'extension', extra: true }], variables: [{ extra: true }], script: '', extra: true };
	expect(v.parse(portablePagesCreateInput, dynamic)).toEqual({ title: dynamic.title, name: dynamic.name, content: dynamic.content, variables: dynamic.variables, script: dynamic.script, font: 'sans-serif', alignCenter: false, hideTitleWhenPinned: false });
	expect(v.parse(portablePagesUpdateInput, { pageId: 'page123', content: [{ extension: true }], variables: [{ extra: true }], extra: true })).toEqual({ pageId: 'page123', content: [{ extension: true }], variables: [{ extra: true }] });
	expect(v.parse(selectorPagesShowInput, { pageId: 'page123', extra: true })).toEqual({ pageId: 'page123' });
	expect(v.parse(selectorPagesShowInput, { name: 'page', username: 'alice', extra: true })).toEqual({ name: 'page', username: 'alice' });
	for (const schema of [portablePagesCreateInput, portablePagesUpdateInput, selectorPagesShowInput]) for (const input of [[], null, 7]) expect(v.safeParse(schema, input).success).toBe(false);
	for (const value of [null, [], 7]) expect(v.safeParse(portablePagesCreateInput, { ...dynamic, content: [value] }).success).toBe(false);
});

test.each(['bad-id', null, 42, false, ['legacy'], { legacy: true }])('competing pageId selector reaches the original repository boundary: %j', async pageId => {
	const { service, page } = fixture();
	const users = mockDeep<ConstructorParameters<typeof PagesShowApplicationService>[0]>();
	const pages = mockDeep<ConstructorParameters<typeof PagesShowApplicationService>[1]>();
	pages.findOneBy.mockResolvedValue(page);
	const application = new PagesShowApplicationService(users, pages, service);
	const input = v.parse(selectorPagesShowInput, { name: 'page', username: 'alice', pageId });
	await application.execute(input, null);
	expect(pages.findOneBy).toHaveBeenCalledWith({ id: pageId });
	expect(users.findOneBy).not.toHaveBeenCalled();
});

test('legacy number inputs retain JSON null for an unparsable default', async () => {
	const { service, page } = fixture();
	page.content = [{ type: 'input', inputType: 'number', default: 'not-a-number' }];
	const output = await service.pack(page);
	expect(v.parse(packedPageSchema, output).content).toEqual([{ type: 'numberInput', inputType: 'number', default: null }]);
});
