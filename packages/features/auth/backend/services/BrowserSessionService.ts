/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomBytes } from 'node:crypto';
import { In, IsNull, LessThanOrEqual } from 'typeorm';
import type { FindOptionsSelect } from 'typeorm';
import type { BrowserSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import { MiSignin } from '../models/Signin.js';
import { MiUserIp } from '../models/UserIp.js';
import { MiBrowserSession } from '../models/BrowserSession.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { SigninPolicyError } from '../signin-assurance.js';

export type BrowserSessionUsage = { ip: string; userAgent: string | null };

export type BrowserSessionMetadata = Pick<MiBrowserSession, 'id' | 'userId' | 'createdAt' | 'lastUsedAt' | 'revokedAt' | 'sudoUntil'>;

const metadataSelect = { id: true, userId: true, createdAt: true, lastUsedAt: true, revokedAt: true, sudoUntil: true } satisfies FindOptionsSelect<MiBrowserSession>;

/** Foundation only: callers must establish authentication before issuing a credential.
 * No positive validity cache: a revoked session must be rejected on the next check. */
export class BrowserSessionService {
	constructor(
		private browserSessionsRepository: BrowserSessionsRepository,
		private idService: Pick<IdService, 'gen'>,
	) {}

	public async issue(userId: string, repository: Pick<BrowserSessionsRepository, 'insert'> = this.browserSessionsRepository, usage?: BrowserSessionUsage): Promise<{ token: string; session: BrowserSessionMetadata }> {
		const token = `bs_${randomBytes(32).toString('base64url')}`;
		const now = new Date();
		const session: BrowserSessionMetadata = {
			id: this.idService.gen(), userId, createdAt: now, lastUsedAt: now,
			revokedAt: null, sudoUntil: null,
		};
		await repository.insert({
			...session, lastUserAgent: usage?.userAgent?.slice(0, 1024) ?? null, tokenHash: createHash('sha256').update(token).digest('hex'),
		});
		return { token, session };
	}

	/** Only creation results from SignupService reach this path; it is not a login proof bypass. */
	public async issueForNewAccount(account: Pick<MiUser, 'id' | 'token'>, usage?: BrowserSessionUsage): Promise<{ token: string; session: BrowserSessionMetadata }> {
		return this.browserSessionsRepository.manager.transaction(async manager => {
			const user = await manager.getRepository(MiUser).findOne({ where: { id: account.id }, lock: { mode: 'pessimistic_write' } });
			if (!user || user.host !== null || user.isSuspended || user.isDeleted || !account.token || user.token !== account.token) throw new SigninPolicyError();
			const profile = await manager.getRepository(MiUserProfile).findOne({ where: { userId: user.id }, lock: { mode: 'pessimistic_write' } });
			if (!profile || profile.twoFactorEnabled || profile.passkeyMfaEnabled) throw new SigninPolicyError();
			return this.issue(user.id, manager.getRepository(MiBrowserSession), usage);
		});
	}

	public async verify(token: string, usage?: BrowserSessionUsage): Promise<BrowserSessionMetadata | null> {
		if (!/^bs_[A-Za-z0-9_-]{43}$/.test(token)) return null;
		const tokenHash = createHash('sha256').update(token).digest('hex');
		const session = await this.browserSessionsRepository.findOne({
			where: { tokenHash, revokedAt: IsNull() }, select: { ...metadataSelect, lastUserAgent: true },
		});
		if (!session) return null;
		const lastUsedAt = new Date();
		const cutoff = new Date(lastUsedAt.getTime() - 60_000);
		const userAgent = usage?.userAgent?.slice(0, 1024) ?? null;
		const changed = usage && session.lastUserAgent !== userAgent;
		if (changed || session.lastUsedAt <= cutoff) {
			await this.browserSessionsRepository.update({
				id: session.id, tokenHash, revokedAt: IsNull(), ...(changed ? {} : { lastUsedAt: LessThanOrEqual(cutoff) }),
			}, { lastUsedAt, ...(usage ? { lastUserAgent: userAgent } : {}) });
		}
		// Always re-read after the optional touch: concurrent revocation wins,
		// and authorization never relies on a cached validity or sudo snapshot.
		return this.browserSessionsRepository.findOne({
			where: { id: session.id, userId: session.userId, revokedAt: IsNull(), user: { id: session.userId, host: IsNull(), isSuspended: false, isDeleted: false } }, select: metadataSelect,
		});
	}

	/** Stream gates check durable validity without producing per-frame writes. */
	public async isActive(sessionId: string, userId: string): Promise<boolean> {
		return await this.browserSessionsRepository.existsBy({ id: sessionId, userId, revokedAt: IsNull(), user: { id: userId, host: IsNull(), isSuspended: false, isDeleted: false } });
	}

	public async revokeAllOwned(userId: string, repository: Pick<BrowserSessionsRepository, 'update'> = this.browserSessionsRepository): Promise<void> {
		await repository.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date(), sudoUntil: null, sudoPolicyStamp: null });
	}

	public async listOwned(userId: string, limit = 100, offset = 0, ids?: string[]): Promise<(BrowserSessionMetadata & Pick<MiBrowserSession, 'lastUserAgent'> & { lastIp: string | null })[]> {
		const sessions = await this.browserSessionsRepository.find({
			where: { userId, ...(ids ? { id: In(ids) } : {}) }, select: { ...metadataSelect, lastUserAgent: true }, take: limit, skip: offset, order: { createdAt: 'DESC', id: 'DESC' },
		});
		if (sessions.length === 0) return [];
		const latest = await this.browserSessionsRepository.manager.getRepository(MiUserIp).createQueryBuilder('ip')
			.select(['ip.browserSessionId', 'ip.ip']).distinctOn(['ip.browserSessionId'])
			.where('ip.userId = :userId', { userId })
			.andWhere('ip.browserSessionId IN (:...ids)', { ids: sessions.map(session => session.id) })
			.orderBy('ip.browserSessionId').addOrderBy('ip.lastSeenAt', 'DESC').addOrderBy('ip.id', 'DESC').getMany();
		const lastIps = new Map(latest.map(row => [row.browserSessionId, row.ip]));
		const missingIds = sessions.filter(session => !lastIps.has(session.id)).map(session => session.id);
		if (missingIds.length > 0) {
			// Signin IDs are chronological, matching latestPerSession in signin-history.
			const signins = await this.browserSessionsRepository.manager.getRepository(MiSignin).createQueryBuilder('signin')
				.select(['signin.browserSessionId', 'signin.ip']).distinctOn(['signin.browserSessionId'])
				.where('signin.userId = :userId', { userId })
				.andWhere('signin.browserSessionId IN (:...ids)', { ids: missingIds })
				.orderBy('signin.browserSessionId').addOrderBy('signin.id', 'DESC').getMany();
			for (const signin of signins) lastIps.set(signin.browserSessionId, signin.ip);
		}
		return sessions.map(session => ({ ...session, lastIp: lastIps.get(session.id) ?? null }));
	}

	public async revokeOwned(userId: string, sessionId: string): Promise<boolean> {
		const result = await this.browserSessionsRepository.update({
			id: sessionId, userId, revokedAt: IsNull(),
		}, { revokedAt: new Date(), sudoUntil: null, sudoPolicyStamp: null });
		return result.affected === 1;
	}
}
