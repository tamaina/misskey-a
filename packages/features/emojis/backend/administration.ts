/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import { emojiAdministrationInputs, emojisContract } from '../contract/index.js';
import { toLegacyJsonSchema } from '../../api/backend/index.js';

export interface EmojiAdministrationDependencies {
	setCategoryBulk(ids: string[], category: string | null): Promise<unknown>;
	setLicenseBulk(ids: string[], license: string | null): Promise<unknown>;
	setAliasesBulk(ids: string[], aliases: string[]): Promise<unknown>;
	addAliasesBulk(ids: string[], aliases: string[]): Promise<unknown>;
	removeAliasesBulk(ids: string[], aliases: string[]): Promise<unknown>;
}

/** Create the admin emoji metadata commands. Transport authorization stays at the API boundary. */
export function createEmojiAdministration(deps: EmojiAdministrationDependencies) {
	return {
		'admin/emoji/set-category-bulk': createProcedureClient(implement(emojisContract['admin/emoji/set-category-bulk'])
			.handler(async ({ input }) => {
				await deps.setCategoryBulk(input.ids, input.category ?? null);
			})),
		'admin/emoji/set-license-bulk': createProcedureClient(implement(emojisContract['admin/emoji/set-license-bulk'])
			.handler(async ({ input }) => {
				await deps.setLicenseBulk(input.ids, input.license ?? null);
			})),
		'admin/emoji/set-aliases-bulk': createProcedureClient(implement(emojisContract['admin/emoji/set-aliases-bulk'])
			.handler(async ({ input }) => {
				await deps.setAliasesBulk(input.ids, input.aliases);
			})),
		'admin/emoji/add-aliases-bulk': createProcedureClient(implement(emojisContract['admin/emoji/add-aliases-bulk'])
			.handler(async ({ input }) => {
				await deps.addAliasesBulk(input.ids, input.aliases);
			})),
		'admin/emoji/remove-aliases-bulk': createProcedureClient(implement(emojisContract['admin/emoji/remove-aliases-bulk'])
			.handler(async ({ input }) => {
				await deps.removeAliasesBulk(input.ids, input.aliases);
			})),
	};
}

export type EmojiAdministrationFeature = ReturnType<typeof createEmojiAdministration>;

export const legacyEmojiAdministrationSchemas: Record<keyof typeof emojiAdministrationInputs, { input: JsonSchema }> = {
	'admin/emoji/set-category-bulk': { input: toLegacyJsonSchema(emojiAdministrationInputs['admin/emoji/set-category-bulk'], { target: 'openapi-3.0' }) },
	'admin/emoji/set-license-bulk': { input: toLegacyJsonSchema(emojiAdministrationInputs['admin/emoji/set-license-bulk'], { target: 'openapi-3.0' }) },
	'admin/emoji/set-aliases-bulk': { input: toLegacyJsonSchema(emojiAdministrationInputs['admin/emoji/set-aliases-bulk'], { target: 'openapi-3.0' }) },
	'admin/emoji/add-aliases-bulk': { input: toLegacyJsonSchema(emojiAdministrationInputs['admin/emoji/add-aliases-bulk'], { target: 'openapi-3.0' }) },
	'admin/emoji/remove-aliases-bulk': { input: toLegacyJsonSchema(emojiAdministrationInputs['admin/emoji/remove-aliases-bulk'], { target: 'openapi-3.0' }) },
};
