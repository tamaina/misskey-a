/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';

import type * as v from 'valibot';
import type { MyAppsContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['account', 'app'],

	requireCredential: true,
	kind: 'read:account',
} as const;

@Injectable()
export class MyAppsOperation {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof MyAppsContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const query = {
			userId: me.id,
		};

		const apps = await this.appsRepository.find({
			where: query,
			take: ps.limit,
			skip: ps.offset,
		});

		return await Promise.all(apps.map(app => this.appEntityService.pack(app, me, {
			detail: true,
		})));
	}
}
