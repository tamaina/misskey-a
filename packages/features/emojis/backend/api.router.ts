/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../api/backend/transport/middleware.js';
import { emojisContract } from './api.contract.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { EmojisOperations } from './api.operations.js';

export type EmojisContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { emojis: EmojisOperations<Actor> } };

export function createEmojisRouter<Actor extends ApiActor>() {
	const api = implement(emojisContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<EmojisContext<Actor>>().use(authentication<Actor>());
	return api.router({
		add: api.add.use(apiPolicy<Actor>({ name: 'admin/emoji/add', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.add(input, context.principal)),
		addAliasesBulk: api.addAliasesBulk.use(apiPolicy<Actor>({ name: 'admin/emoji/add-aliases-bulk', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.addAliasesBulk(input, context.principal)),
		copy: api.copy.use(apiPolicy<Actor>({ name: 'admin/emoji/copy', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.copy(input, context.principal)),
		delete: api.delete.use(apiPolicy<Actor>({ name: 'admin/emoji/delete', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.delete(input, context.principal)),
		deleteBulk: api.deleteBulk.use(apiPolicy<Actor>({ name: 'admin/emoji/delete-bulk', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.deleteBulk(input, context.principal)),
		importZip: api.importZip.use(apiPolicy<Actor>({ name: 'admin/emoji/import-zip', requireCredential: true, requireAdmin: true, secure: true })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.importZip(input, context.principal)),
		list: api.list.use(apiPolicy<Actor>({ name: 'admin/emoji/list', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'read:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.list(input, context.principal)),
		listRemote: api.listRemote.use(apiPolicy<Actor>({ name: 'admin/emoji/list-remote', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'read:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.listRemote(input, context.principal)),
		removeAliasesBulk: api.removeAliasesBulk.use(apiPolicy<Actor>({ name: 'admin/emoji/remove-aliases-bulk', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.removeAliasesBulk(input, context.principal)),
		setAliasesBulk: api.setAliasesBulk.use(apiPolicy<Actor>({ name: 'admin/emoji/set-aliases-bulk', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.setAliasesBulk(input, context.principal)),
		setCategoryBulk: api.setCategoryBulk.use(apiPolicy<Actor>({ name: 'admin/emoji/set-category-bulk', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.setCategoryBulk(input, context.principal)),
		setLicenseBulk: api.setLicenseBulk.use(apiPolicy<Actor>({ name: 'admin/emoji/set-license-bulk', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.setLicenseBulk(input, context.principal)),
		update: api.update.use(apiPolicy<Actor>({ name: 'admin/emoji/update', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.update(input, context.principal)),
		emoji: api.emoji.use(apiPolicy<Actor>({ name: 'emoji' }))
			.handler(({ input, context }) => context.operations.emojis.emoji(input, context.principal)),
		emojis: api.emojis.use(apiPolicy<Actor>({ name: 'emojis' }))
			.handler(({ input, context }) => context.operations.emojis.emojis(input, context.principal)),
		emojiGet: api.emojiGet.use(apiPolicy<Actor>({ name: 'emoji' }))
			.handler(({ input, context }) => context.operations.emojis.emoji(input, context.principal)),
		emojisGet: api.emojisGet.use(apiPolicy<Actor>({ name: 'emojis' }))
			.handler(({ input, context }) => context.operations.emojis.emojis(input, context.principal)),
		exportCustomEmojis: api.exportCustomEmojis.use(apiPolicy<Actor>({ name: 'export-custom-emojis', requireCredential: true, secure: true, limit: { duration: 3600000, max: 1 } })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.exportCustomEmojis(input, context.principal)),
		v2List: api.v2List.use(apiPolicy<Actor>({ name: 'v2/admin/emoji/list', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'read:admin:emoji' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.emojis.v2List(input, context.principal)),
	});
}
