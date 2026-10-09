/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import * as v from 'valibot';
import { inlineIAppsInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

@Injectable()
export class IAppsOperation {
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<typeof inlineIAppsInput>, me: MiLocalUser) {
		const query = this.accessTokensRepository.createQueryBuilder('token')
			.where('token.userId = :userId', { userId: me.id })
			.leftJoinAndSelect('token.app', 'app');

		switch (ps.sort) {
			case '+createdAt': query.orderBy('token.id', 'DESC'); break;
			case '-createdAt': query.orderBy('token.id', 'ASC'); break;
			case '+lastUsedAt': query.orderBy('token.lastUsedAt', 'DESC'); break;
			case '-lastUsedAt': query.orderBy('token.lastUsedAt', 'ASC'); break;
			default: query.orderBy('token.id', 'ASC'); break;
		}

		const tokens = await query.getMany();

		return await Promise.all(tokens.map(token => ({
			id: token.id,
			name: token.name ?? token.app?.name,
			createdAt: this.idService.parse(token.id).date.toISOString(),
			lastUsedAt: token.lastUsedAt?.toISOString(),
			permission: token.app ? token.app.permission : token.permission,
			iconUrl: token.iconUrl,
			description: token.description ?? token.app?.description ?? null,
		})));
	}
}
