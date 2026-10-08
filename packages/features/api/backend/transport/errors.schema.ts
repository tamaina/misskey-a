/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** Error detail remains extensible; successful response DTOs are finite. */
export const apiErrorData = v.object({
	id: v.string(),
	kind: v.picklist(['client', 'permission', 'server']),
	info: v.optional(v.record(v.string(), v.unknown())),
});

export const commonErrors = {
	AUTHENTICATION_FAILED: { status: 401, data: apiErrorData },
	CREDENTIAL_REQUIRED: { status: 401, data: apiErrorData },
	YOUR_ACCOUNT_SUSPENDED: { status: 403, data: apiErrorData },
	YOUR_ACCOUNT_MOVED: { status: 403, data: apiErrorData },
	PERMISSION_DENIED: { status: 403, data: apiErrorData },
	RATE_LIMIT_EXCEEDED: { status: 429, data: apiErrorData },
	INVALID_PARAM: { status: 400, data: apiErrorData },
	INTERNAL_ERROR: { status: 500, data: apiErrorData },
} as const;
