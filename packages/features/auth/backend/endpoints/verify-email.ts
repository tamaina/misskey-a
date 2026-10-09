/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import { VerifyEmailContract } from '../api.definition.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export const meta = {
	requireCredential: false,

	tags: ['account'],

	errors: {
		noSuchCode: {
			message: 'No such code.',
			code: 'NO_SUCH_CODE',
			id: '97c1f576-e4b8-4b8a-a6dc-9cb65e7f6f85',
		},
	},
} as const;
export interface VerifyEmailDependencies {
	userProfilesRepository: UserProfilesRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createVerifyEmailProcedure(deps: VerifyEmailDependencies) {
	return implement(VerifyEmailContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'verify-email' })).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			const profile = await deps.userProfilesRepository.findOneBy({
				emailVerifyCode: ps.code,
			});

			if (profile == null) {
				throw apiError(meta.errors.noSuchCode);
			}

			await deps.userProfilesRepository.update({ userId: profile.userId }, {
				emailVerified: true,
				emailVerifyCode: null,
			});

			deps.globalEventService.publishMainStream(profile.userId, 'meUpdated', await deps.userEntityService.packSelf(profile.userId, {
				includeSecrets: true,
			}));
		})();
		return v.parse(requiredSchema(VerifyEmailContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
