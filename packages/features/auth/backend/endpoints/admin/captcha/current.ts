/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { CaptchaService } from '../../../services/CaptchaService.js';
import { AdminCaptchaCurrentContract } from '../../../api.definition.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
export const meta = {
	tags: ['admin', 'captcha'],

	// 実態はmetaの取得であるため

} as const;
export interface AdminCaptchaCurrentDependencies {
	captchaService: Pick<CaptchaService, 'get'>;
}
export function createAdminCaptchaCurrentProcedure(deps: AdminCaptchaCurrentDependencies) {
	return createApiProcedure<MiLocalUser>()(AdminCaptchaCurrentContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const result = await (async () => {
			return deps.captchaService.get();
		})();
		return { provider: result.provider,
			hcaptcha: { siteKey: result.hcaptcha.siteKey, secretKey: result.hcaptcha.secretKey },
			mcaptcha: { siteKey: result.mcaptcha.siteKey, secretKey: result.mcaptcha.secretKey, instanceUrl: result.mcaptcha.instanceUrl },
			recaptcha: { siteKey: result.recaptcha.siteKey, secretKey: result.recaptcha.secretKey },
			turnstile: { siteKey: result.turnstile.siteKey, secretKey: result.turnstile.secretKey } };
	});
}
