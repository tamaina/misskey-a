/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import type { DataSource } from 'typeorm';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { assertLegacyMfaManagement, assertSameMfaPolicy } from '@features/auth/backend/mfa-policy.js';
import { legacyManagementOnly } from '@features/auth/backend/legacy-management.js';
import { queueCommittedAccountDeletion } from '@features/auth/backend/account-deletion.js';
import type { AccountDeletionDependencies } from '@features/auth/backend/account-deletion.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import type { DeleteAccountService } from '../../services/DeleteAccountService.js';
import { MiUser } from '../../models/User.js';
import { MiUserProfile } from '../../models/UserProfile.js';
import type { MiLocalUser } from '../../models/User.js';
import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { iDeleteAccountContract } from './delete-account.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface IDeleteAccountDependencies extends AccountDeletionDependencies {
	db: Pick<DataSource, 'transaction'>;
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	userAuthService: UserAuthService;
	deleteAccountService: DeleteAccountService;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}
/** Legacy native credentials keep their password/factor proof, but use the same
 * locked deletion intent. Browser sessions use the sudo settings operation.
 */
export function createIDeleteAccountProcedure(deps: IDeleteAccountDependencies) {
	return createApiProcedure<MiLocalUser>()(iDeleteAccountContract).use(requirePrincipal<MiLocalUser>()).use(legacyManagementOnly())
		.handler(async ({ input, context }) => {
			const deadline = performance.now() + 90_000;
			const user = await deps.usersRepository.findOneByOrFail({ id: context.principal.id });
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });
			assertLegacyMfaManagement(profile);
			if (!user.token || user.token !== context.principal.token || user.host !== null || user.isSuspended || user.isDeleted
				|| !profile.password || !await bcrypt.compare(input.password, profile.password)) throw new Error('Authentication failed');
			if (profile.twoFactorEnabled) {
				if (!input.token) throw new Error('Authentication failed');
				await deps.userAuthService.twoFactorAuthenticate(profile, input.token);
			}
			await deps.db.transaction(async manager => {
				const current = await manager.getRepository(MiUser).findOne({ where: { id: user.id }, lock: { mode: 'pessimistic_write' } });
				const policy = await manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId: user.id }, lock: { mode: 'pessimistic_write' } });
				if (!current || current.token !== user.token || current.isSuspended || performance.now() >= deadline) throw new Error('Authentication failed');
				assertLegacyMfaManagement(policy); assertSameMfaPolicy(profile, policy);
				await queueCommittedAccountDeletion(manager, current, policy, deps);
				if (performance.now() >= deadline) throw new Error('Authentication failed');
			});
			deps.globalEventService.publishInternalEvent('browserSessionRevoked', { id: null, userId: user.id });
			deps.globalEventService.publishInternalEvent('userChangeDeletedState', { id: user.id, isDeleted: true });
		});
}
