/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EmailService } from '../../../../email/backend/services/EmailService.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import { adminSendEmailContract } from './send-email.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';
export interface AdminSendEmailDependencies {
	emailService: Pick<EmailService, 'sendEmail'>;
}
export function createAdminSendEmailProcedure(deps: AdminSendEmailDependencies) {
	return createApiProcedure<MiLocalUser>()(adminSendEmailContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				await deps.emailService.sendEmail(ps.to, ps.subject, ps.text, ps.text);
			})();
			return result;
		});
}
