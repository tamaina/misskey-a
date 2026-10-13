/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomBytes } from 'node:crypto';
import { IsNull } from 'typeorm';
import type { FindOptionsSelect } from 'typeorm';
import type { BrowserSessionsRepository, MiBrowserSession } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';

export type BrowserSessionMetadata = Pick<MiBrowserSession, 'id' | 'userId' | 'createdAt' | 'lastUsedAt' | 'revokedAt' | 'sudoUntil'>;

const metadataSelect = { id: true, userId: true, createdAt: true, lastUsedAt: true, revokedAt: true, sudoUntil: true } satisfies FindOptionsSelect<MiBrowserSession>;

/** Foundation only: callers must establish authentication before issuing a credential.
 * No positive validity cache: a revoked session must be rejected on the next check. */
export class BrowserSessionService {
	constructor(
		private browserSessionsRepository: BrowserSessionsRepository,
		private idService: Pick<IdService, 'gen'>,
	) {}

	public async issue(userId: string): Promise<{ token: string; session: BrowserSessionMetadata }> {
		const token = `bs_${randomBytes(32).toString('base64url')}`;
		const now = new Date();
		const session: BrowserSessionMetadata = {
			id: this.idService.gen(), userId, createdAt: now, lastUsedAt: now,
			revokedAt: null, sudoUntil: null,
		};
		await this.browserSessionsRepository.insert({
			...session, tokenHash: createHash('sha256').update(token).digest('hex'),
		});
		return { token, session };
	}

	public async verify(token: string): Promise<BrowserSessionMetadata | null> {
		if (!/^bs_[A-Za-z0-9_-]{43}$/.test(token)) return null;
		const tokenHash = createHash('sha256').update(token).digest('hex');
		const session = await this.browserSessionsRepository.findOne({
			where: { tokenHash, revokedAt: IsNull() }, select: metadataSelect,
		});
		if (!session) return null;
		const lastUsedAt = new Date();
		// Revocation may occur between the read and write. Only an active row can
		// authorize this check; a concurrent revocation must never be overwritten.
		const result = await this.browserSessionsRepository.update({
			id: session.id, tokenHash, revokedAt: IsNull(),
		}, { lastUsedAt });
		return result.affected === 1 ? { ...session, lastUsedAt } : null;
	}

	public async listOwned(userId: string): Promise<BrowserSessionMetadata[]> {
		return this.browserSessionsRepository.find({
			where: { userId }, select: metadataSelect, order: { createdAt: 'DESC', id: 'DESC' },
		});
	}

	public async revokeOwned(userId: string, sessionId: string): Promise<boolean> {
		const result = await this.browserSessionsRepository.update({
			id: sessionId, userId, revokedAt: IsNull(),
		}, { revokedAt: new Date(), sudoUntil: null });
		return result.affected === 1;
	}
}
