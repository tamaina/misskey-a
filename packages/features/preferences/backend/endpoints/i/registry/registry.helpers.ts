/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError, internalError } from '../../../../../api/backend/transport/orpc-error.js';
import type { ApiToken } from '../../../../../api/backend/transport/context.js';
export function registryTenant(domain: string | null | undefined, token: ApiToken | null): string | null {
	if (token === null) return domain ?? null;
	if (token.id === undefined || token.id.length === 0) throw apiError(internalError);
	return token.id;
}
