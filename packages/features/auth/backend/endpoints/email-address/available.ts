/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EmailService } from '@features/email/backend/services/EmailService.js';
import * as v from 'valibot';
import { EmailAddressAvailableContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export const meta = {
	tags: ['users'],

	requireCredential: false,
} as const;
export interface EmailAddressAvailableDependencies {
	emailService: Pick<EmailService, 'validateEmailForAccount'>;
}
export function createEmailAddressAvailableProcedure(deps: EmailAddressAvailableDependencies) {
	return implement(EmailAddressAvailableContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'email-address/available' })).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			return await deps.emailService.validateEmailForAccount(ps.emailAddress);
		})();
		return v.parse(requiredSchema(EmailAddressAvailableContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
