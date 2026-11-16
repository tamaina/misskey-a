/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { randomBytes } from 'node:crypto';
import type { EntityManager } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { MiBrowserSession } from './models/BrowserSession.js';

export interface AccountDeletionDependencies {
	meta: Pick<MiMeta, 'rootUserId'>;
	queue: Pick<QueueService, 'createDeleteAccountJob'>;
}
/** Caller has verified its authority under user -> profile locks. A queue worker
 * serializes on the same locks and matches this exact intent before any effect.
 */
export async function queueCommittedAccountDeletion(manager: EntityManager, user: MiUser, profile: MiUserProfile, deps: AccountDeletionDependencies) {
	if (profile.userId !== user.id || user.host !== null || user.isDeleted || user.id === deps.meta.rootUserId || user.username.includes('.')) throw new Error('Account deletion failed');
	const deletionIntentId = randomBytes(32).toString('base64url');
	await manager.getRepository(MiUserProfile).update({ userId: user.id }, { deletionIntentId });
	await manager.getRepository(MiUser).update(user.id, { isDeleted: true });
	await manager.getRepository(MiBrowserSession).update({ userId: user.id }, { revokedAt: new Date(), sudoUntil: null, sudoPolicyStamp: null });
	await deps.queue.createDeleteAccountJob(user, { soft: false, requiresCommittedDeletion: true, deletionIntentId });
}
