/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';

import type { AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';

import * as v from 'valibot';
import { inlineIAuthorizedAppsInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

@Injectable()
export class IAuthorizedAppsOperation {
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private appEntityService: AppEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof inlineIAuthorizedAppsInput>, me: MiLocalUser) {
		// Get tokens
		const tokens = await this.accessTokensRepository.find({
			where: {
				userId: me.id,
				appId: Not(IsNull()),
			},
			take: ps.limit,
			skip: ps.offset,
			order: {
				id: ps.sort === 'asc' ? 1 : -1,
			},
		});

		return await Promise.all(tokens.map(token => this.appEntityService.pack(token.appId!, me, {
			detail: true,
		})));
	}
}
