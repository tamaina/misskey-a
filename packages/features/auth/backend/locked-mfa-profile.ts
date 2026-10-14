/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { assertSameMfaPolicy } from './mfa-policy.js';
import type { MfaPolicySnapshot } from './mfa-policy.js';
import type { DataSource, EntityManager } from 'typeorm';

/** Authenticate before locking: recovery consumption uses its own DB update.
 * Recheck the credential policy after locking, and mutate only with this manager.
 * All future activation/key-enrolment writers must adopt this same profile lock.
 */
export async function withLockedMfaProfile<T>(db: DataSource, userId: string, expected: MfaPolicySnapshot | undefined, mutate: (profile: MiUserProfile, manager: EntityManager) => Promise<T>): Promise<T> {
	return await db.transaction(async manager => {
		const profile = await manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId }, lock: { mode: 'pessimistic_write' } });
		if (expected) assertSameMfaPolicy(expected, profile);
		return await mutate(profile, manager);
	});
}
