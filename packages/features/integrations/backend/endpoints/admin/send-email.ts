/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EmailService } from '../../../../email/backend/services/EmailService.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSendEmailContract } from './send-email.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export interface AdminSendEmailDependencies {
	emailService: Pick<EmailService, 'sendEmail'>;
}
export function createAdminSendEmailProcedure(deps: AdminSendEmailDependencies) {
	return implement(adminSendEmailContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: 'admin/send-email', requireCredential: true, requireModerator: true, kind: 'write:admin:send-email' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				await deps.emailService.sendEmail(ps.to, ps.subject, ps.text, ps.text);
			})();
			return v.parse(requiredSchema(adminSendEmailContract['~orpc'].outputSchema), result);
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
