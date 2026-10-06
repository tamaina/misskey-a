/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandErrors } from '../contract/index.js';

export * from './commands.js';

/** Legacy HTTP metadata kept at the feature boundary while its input schemas come from the contract. */
export const moderationCommandMeta = {
	'admin/suspend-user': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:suspend-user',
	},
	'admin/unsuspend-user': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:unsuspend-user',
	},
	'admin/unset-user-avatar': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:unset-user-avatar',
	},
	'admin/unset-user-banner': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:unset-user-banner',
	},
	'admin/update-user-note': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:user-note',
	},
	'admin/forward-abuse-user-report': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:resolve-abuse-user-report',
		errors: moderationCommandErrors['admin/forward-abuse-user-report'],
	},
	'admin/resolve-abuse-user-report': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:resolve-abuse-user-report',
		errors: moderationCommandErrors['admin/resolve-abuse-user-report'],
	},
	'admin/update-abuse-user-report': {
		tags: ['admin'],
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:resolve-abuse-user-report',
		errors: moderationCommandErrors['admin/update-abuse-user-report'],
	},
	'admin/abuse-report/notification-recipient/delete': {
		tags: ['admin', 'abuse-report', 'notification-recipient'],
		requireCredential: true,
		requireModerator: true,
		secure: true,
		kind: 'write:admin:abuse-report:notification-recipient',
	},
} as const;
