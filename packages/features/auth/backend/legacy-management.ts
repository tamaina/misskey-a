/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { os } from '@orpc/server';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { AuthenticatedContext } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

/** Compatibility writers cannot bypass session sudo. Browser clients use i/security/*,
 * where authorization and mutation share their transaction. Legacy tokens retain
 * their old proof requirements and cannot manage independent/passwordless policy.
 */
export function legacyManagementOnly() {
	return os.$context<AuthenticatedContext<MiLocalUser>>().middleware(({ context, next }) => {
		if (context.browserSession) throw apiError({ code: 'PERMISSION_DENIED', status: 403, kind: 'permission',
			message: 'Use the session-authorized security settings operation.', id: 'cd6149f1-54aa-4fd7-a6ee-95cdce12c43d' });
		return next();
	});
}
