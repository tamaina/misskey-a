/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { DI } from '@/di-symbols.js';

import type * as v from 'valibot';
import type { MiauthGenTokenContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,
} as const;

@Injectable()
export class MiauthGenTokenOperation {
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
		private notificationService: NotificationService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof MiauthGenTokenContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		// Generate access token
		const accessToken = secureRndstr(32);

		const now = new Date();

		// Insert access token doc
		await this.accessTokensRepository.insert({
			id: this.idService.gen(now.getTime()),
			lastUsedAt: now,
			session: ps.session,
			userId: me.id,
			token: accessToken,
			hash: accessToken,
			name: ps.name,
			description: ps.description,
			iconUrl: ps.iconUrl,
			permission: ps.permission,
		});

		// アクセストークンが生成されたことを通知
		this.notificationService.createNotification(me.id, 'createToken', {});

		return {
			token: accessToken,
		};
	}
}
