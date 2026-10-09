/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import type { UserProfilesRepository, PasswordResetRequestsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { ResetPasswordContract } from '../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['reset password'],

	description: 'Complete the password reset that was previously requested.',

	errors: {

	},
} as const;
export interface ResetPasswordDependencies {
	passwordResetRequestsRepository: PasswordResetRequestsRepository;
	userProfilesRepository: UserProfilesRepository;
	idService: Pick<IdService, 'parse'>;
}
export function createResetPasswordProcedure(deps: ResetPasswordDependencies) {
	return createApiProcedure<MiLocalUser>()(ResetPasswordContract).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			const req = await deps.passwordResetRequestsRepository.findOneByOrFail({
				token: ps.token,
			});

			// 発行してから30分以上経過していたら無効
			if (Date.now() - deps.idService.parse(req.id).date.getTime() > 1000 * 60 * 30) {
				throw new Error(); // TODO
			}

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(ps.password, salt);

			await deps.userProfilesRepository.update(req.userId, {
				password: hash,
			});

			deps.passwordResetRequestsRepository.delete(req.id);
		})();
		return result;
	});
}
