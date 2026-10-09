/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { CaptchaService } from '../../../services/CaptchaService.js';
import { AdminCaptchaCurrentContract } from '../../../api.definition.js';
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export const meta = {
	tags: ['admin', 'captcha'],

	requireCredential: true,
	requireAdmin: true,

	// 実態はmetaの取得であるため
	kind: 'read:admin:meta',
} as const;
export interface AdminCaptchaCurrentDependencies {
	captchaService: Pick<CaptchaService, 'get'>;
}
export function createAdminCaptchaCurrentProcedure(deps: AdminCaptchaCurrentDependencies) {
	return implement(AdminCaptchaCurrentContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'admin/captcha/current', requireCredential: true, requireAdmin: true, kind: 'read:admin:meta' })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const result = await (async () => {
			return deps.captchaService.get();
		})();
		return v.parse(requiredSchema(AdminCaptchaCurrentContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
