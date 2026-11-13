/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';

import { EmailAddressAvailableContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['users'],

} as const;
export interface EmailAddressAvailableDependencies {
	emailService: Pick<EmailService, 'validateEmailForAccount'>;
}
export function createEmailAddressAvailableProcedure(deps: EmailAddressAvailableDependencies) {
	return createApiProcedure<MiLocalUser>()(EmailAddressAvailableContract).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			return await deps.emailService.validateEmailForAccount(ps.emailAddress);
		})();
		return result;
	});
}
